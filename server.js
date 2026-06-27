const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Kahoot = require("kahoot.js-latest");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

// ===== BOT MANAGER =====
class BotManager {
    constructor() {
        this.bots = []; this.globalMode = "none"; this.roundOverride = null;
        this.joinedCount = 0;
        this.answerCache = new Map();
        this.questions = {};
        this.totalCount = 0; this.pin = ""; this.baseName = "";
        this.scores = {}; this.io = null;
    }
    bindIO(io) { this.io = io; }

    emit(event, data) { if (this.io) this.io.emit(event, data); }

    storeQuestionData(idx, question, choices) {
        if (!this.questions[idx]) this.questions[idx] = { question, choices };
    }

    async resolveAnswer(qIdx, questionData) {
        if (this.roundOverride !== null) {
            const a = this.roundOverride;
            this.answerCache.set(qIdx, a);
            this.roundOverride = null;
            return a;
        }
        if (this.answerCache.has(qIdx)) return this.answerCache.get(qIdx);

        switch (this.globalMode) {
            case "random": return Math.floor(Math.random() * 4);
            default:
                if (this.globalMode.startsWith("fix_")) return parseInt(this.globalMode.split("_")[1]);
                return null;
        }
    }

    setMode(mode) {
        this.globalMode = mode;
        this.answerCache.clear();
        this.emit("modeChanged", { mode: this.modeLabel() });
    }

    setRound(choice) { this.roundOverride = choice; }

    modeLabel() {
        if (this.globalMode === "random") return "Random";
        if (this.globalMode === "none") return "None";
        if (this.globalMode.startsWith("fix_")) return `Fix #${this.globalMode.split("_")[1]}`;
        return this.globalMode;
    }

    async launch(config) {
        this.pin = config.pin; this.baseName = config.baseName; this.totalCount = config.count;
        this.globalMode = config.mode; this.bots = []; this.joinedCount = 0;
        this.answerCache.clear(); this.questions = {}; this.scores = {};

        const maxNameLen = (this.baseName + this.totalCount).length;
        const BATCH = 5;

        const pad = (s, l) => s + " ".repeat(Math.max(0, l - s.length));

        this.emit("launchStarted", { pin: this.pin, count: this.totalCount, mode: this.modeLabel() });

        for (let i = 1; i <= this.totalCount; i++) {
            const name = this.baseName + i;
            const client = new Kahoot();
            const padded = pad(name, maxNameLen);

            client.on("Joined", () => {
                this.joinedCount++;
                this.emit("botJoined", { name: padded, joined: this.joinedCount, total: this.totalCount });
            });
            client.on("Disconnect", (reason) => {
                this.joinedCount--;
                this.emit("botDisconnect", { name: padded, reason, joined: this.joinedCount, total: this.totalCount });
            });
            client.on("QuizStart", (quiz) => {
                if (quiz && quiz.firstGameBlockData) {
                    const fb = quiz.firstGameBlockData;
                    const q = fb.question || "";
                    const c = (fb.choices || []).map(x => ({ answer: x.answer || "", correct: x.correct }));
                    if (q && c.length) this.storeQuestionData(0, q, c);
                }
                this.emit("log", { msg: `[${padded}] Quiz started!`, type: "info" });
            });

            client.on("QuestionStart", async (q) => {
                const qIdx = q.questionIndex !== undefined ? q.questionIndex : 0;
                const stored = this.questions[qIdx];
                const qText = stored ? stored.question : "";
                const choices = stored ? stored.choices : [];
                const nChoices = stored ? choices.length : q.quizQuestionAnswers?.[qIdx] || "?";

                this.emit("questionStart", {
                    index: qIdx,
                    text: qText,
                    choices: choices.map(c => c.answer || c),
                    nChoices,
                    type: q.gameBlockType || "quiz",
                    hasData: !!stored,
                });

                const data = this.questions[qIdx] || null;
                const answer = await this.resolveAnswer(qIdx, data);
                if (answer !== null && answer !== undefined) {
                    q.answer(answer);
                }
            });

            client.on("QuestionEnd", (e) => {
                this.emit("questionEnd", {
                    name: padded,
                    choice: e.choice,
                    isCorrect: e.isCorrect,
                    points: e.points || 0,
                    totalScore: e.totalScore || 0,
                    rank: e.rank || "?",
                });
            });

            client.on("QuizEnd", (e) => {
                this.emit("quizEnd", {
                    name: padded,
                    totalScore: e.totalScore || 0,
                    rank: e.rank || "?",
                });
            });

            this.bots.push({ client, name });
            client.join(this.pin, name).catch(err => {
                this.emit("log", { msg: `[${padded}] Error: ${err.description || err.message || err}`, type: "error" });
            });

            if (i % BATCH === 0) {
                this.emit("progress", { sent: i, total: this.totalCount });
                await new Promise(r => setTimeout(r, 200));
            }
        }

        this.emit("launchDone", { sent: this.totalCount, total: this.totalCount });
    }

    leaveAll() {
        for (const b of this.bots) { try { b.client.leave(); } catch (e) { /* */ } }
        this.emit("allLeft", {});
        this.bots = [];
    }
}

// ===== SOCKET.IO =====
const manager = new BotManager();

io.on("connection", (socket) => {
    console.log("[+] Web client connected");
    manager.bindIO(io);

    socket.on("launch", (config) => {
        manager.questions = {};
        manager.launch(config);
    });

    socket.on("setMode", (mode) => {
        manager.setMode(mode);
    });

    socket.on("setRound", (choice) => {
        manager.setRound(choice);
    });

    socket.on("leaveAll", () => {
        manager.leaveAll();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("=".repeat(50));
    console.log("  Kahoot Bot Spammer - Web Server");
    console.log(`  http://localhost:${PORT}`);
    console.log("=".repeat(50));
});
