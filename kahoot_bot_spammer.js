const Kahoot = require("kahoot.js-latest");
const readline = require("readline");

// ===== ANSI COLORS =====
const C = {
    r: "\x1b[31m",
    g: "\x1b[32m",
    y: "\x1b[33m",
    b: "\x1b[34m",
    m: "\x1b[35m",
    c: "\x1b[36m",
    w: "\x1b[37m",
    R: "\x1b[0m",
    D: "\x1b[2m",
    B: "\x1b[1m",
};

// ===== BOT MANAGER =====
class BotManager {
    constructor() {
        this.bots = [];
        this.globalMode = "none";
        this.roundOverride = null;
        this.joinedCount = 0;
        this.answerCache = new Map();
        this.lastQuestionIdx = -1;
        this.questions = {};
    }

    storeQuestionData(index, question, choices) {
        if (!this.questions[index]) {
            this.questions[index] = { question, choices };
        }
    }

    async resolveAnswer(questionIndex, questionData) {
        const qIdx = questionIndex;

        if (this.roundOverride !== null) {
            const answer = this.roundOverride;
            this.answerCache.set(qIdx, answer);
            this.roundOverride = null;
            return answer;
        }

        if (this.answerCache.has(qIdx)) return this.answerCache.get(qIdx);

        switch (this.globalMode) {
            case "random":
                return Math.floor(Math.random() * 4);

            default:
                if (this.globalMode.startsWith("fix_")) {
                    return parseInt(this.globalMode.split("_")[1]);
                }
                return null;
        }
    }

    setMode(mode) {
        this.globalMode = mode;
        this.answerCache.clear();
    }

    setRound(choice) {
        this.roundOverride = choice;
    }

    modeLabel() {
        if (this.globalMode === "random") return "Random";
        if (this.globalMode === "none") return "None";
        if (this.globalMode.startsWith("fix_")) return `Fix #${this.globalMode.split("_")[1]}`;
        return this.globalMode;
    }
}

// ===== HELPERS =====
function padRight(str, len) {
    return str + " ".repeat(Math.max(0, len - str.length));
}

// ===== MAIN =====
async function main() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise((r) => rl.question(q, r));

    console.log(C.B + C.c + "=".repeat(50) + C.R);
    console.log(C.B + C.c + "  Kahoot Bot Spammer v3.2" + C.R);
    console.log(C.B + C.c + "=".repeat(50) + C.R);

    const pin = (await ask("\n  Game-PIN: ")).trim();
    if (!/^\d+$/.test(pin)) {
        console.log("\n  [!] Ungueltige PIN.");
        process.exit(1);
    }

    const baseName = (await ask("  Bot-Name: ")).trim();
    if (!baseName) {
        console.log("\n  [!] Kein Name.");
        process.exit(1);
    }

    const countStr = (await ask("  Anzahl: ")).trim();
    const count = parseInt(countStr);
    if (!count || count < 1) {
        console.log("\n  [!] Ungueltige Anzahl.");
        process.exit(1);
    }

    console.log("\n  Start-Modus:");
    console.log("    [0] Keine Antworten (nur zuschauen)");
    console.log("    [1] Zufaellig antworten");
    console.log("    [2] Immer Antwort 1 (rot)");
    console.log("    [3] Immer Antwort 2 (blau)");
    console.log("    [4] Immer Antwort 3 (gelb)");
    console.log("    [5] Immer Antwort 4 (gruen)");

    const modeStr = (await ask("\n  Modus (0-5): ")).trim();
    const modeNum = parseInt(modeStr);
    if (isNaN(modeNum) || modeNum < 0 || modeNum > 5) {
        console.log("\n  [!] Ungueltiger Modus.");
        process.exit(1);
    }

    let initMode;
    if (modeNum === 0) initMode = "none";
    else if (modeNum === 1) initMode = "random";
    else if (modeNum >= 2 && modeNum <= 5) initMode = `fix_${modeNum - 2}`;

    const manager = new BotManager();
    manager.setMode(initMode);

    console.log(`\n  Modus: ${C.B}${manager.modeLabel()}${C.R}`);
    console.log(`\n  Sende ${count} Bots zu PIN ${pin}...`);
    console.log(`  Name: ${baseName}1 .. ${baseName}${count}\n`);

    const maxNameLen = (baseName + count).length;
    const BATCH = 5;

    for (let i = 1; i <= count; i++) {
        const name = baseName + i;
        const client = new Kahoot();
        const padded = padRight(name, maxNameLen);

        client.on("Joined", () => {
            manager.joinedCount++;
            console.log(`  ${C.D}[${padded}]${C.R} ${C.g}Joined${C.R}  (${manager.joinedCount}/${count})`);
        });
        client.on("Disconnect", (reason) => {
            manager.joinedCount--;
            console.log(
                `  ${C.D}[${padded}]${C.R} ${C.r}Disconnect${C.R}: ${reason}  (${manager.joinedCount}/${count})`,
            );
        });

        // QuizStart: captures firstGameBlockData for question 0
        client.on("QuizStart", (quiz) => {
            if (quiz && quiz.firstGameBlockData) {
                const fb = quiz.firstGameBlockData;
                const question = fb.question || "";
                const choices = (fb.choices || []).map((c) => ({
                    answer: c.answer || "",
                    correct: c.correct,
                }));
                if (question && choices.length) {
                    manager.storeQuestionData(0, question, choices);
                }
            }
            console.log(`  ${C.D}[${padded}]${C.R} ${C.c}Quiz started!${C.R}`);
        });

        client.on("QuestionStart", async (q) => {
            const qIdx = q.questionIndex !== undefined ? q.questionIndex : 0;

            if (manager.lastQuestionIdx !== qIdx) {
                manager.lastQuestionIdx = qIdx;

                const stored = manager.questions[qIdx];
                const qText = stored ? stored.question : "";
                const choices = stored ? stored.choices : [];
                const nChoices = stored
                    ? choices.length
                    : q.quizQuestionAnswers?.[qIdx] || "?";

                const sep = "-".repeat(40);
                console.log(`\n  ${C.B}${C.c}${sep}${C.R}`);
                console.log(
                    `  ${C.B}${C.c}Question #${qIdx + 1}${C.R}${C.D} | ${nChoices} choices | ${q.gameBlockType || "quiz"}${C.R}`,
                );
                if (qText) console.log(`  ${C.c}${qText}${C.R}`);
                choices.forEach((c, ci) => {
                    console.log(`    ${C.D}[${ci}]${C.R} ${c.answer || c}`);
                });
                console.log(`  ${C.B}${C.c}${sep}${C.R}`);
            }

            const questionData = manager.questions[qIdx] || null;
            const answer = await manager.resolveAnswer(qIdx, questionData);
            if (answer !== null && answer !== undefined) {
                q.answer(answer);
            }
        });

        client.on("QuestionEnd", (e) => {
            const isCorrect = e.isCorrect;
            const pts = e.points || 0;
            const score = e.totalScore || 0;
            const rank = e.rank || "?";

            const status = isCorrect
                ? `${C.g}CORRECT${C.R}`
                : `${C.r}WRONG${C.R}`;
            const ptsStr = pts > 0 ? `${C.g}+${pts}${C.R}` : `${C.D}+0${C.R}`;

            console.log(
                `  ${C.D}[${padded}]${C.R} Ans: ${e.choice ?? "?"} | ${status} | ${ptsStr} | Score: ${C.y}${score}${C.R} | Rank: ${C.y}#${rank}${C.R}`,
            );
        });

        client.on("QuizEnd", (e) => {
            const score = e.totalScore || 0;
            const rank = e.rank || "?";
            console.log(
                `  ${C.D}[${padded}]${C.R} ${C.m}Quiz Ended${C.R} | Final: ${C.B}${C.y}${score}${C.R} pts | Rank: ${C.B}#${rank}${C.R}`,
            );
        });

        manager.bots.push({ client, name });

        client.join(pin, name).catch((err) => {
            console.log(`  ${C.D}[${padded}]${C.R} ${C.r}Error${C.R}: ${err.description || err.message || err}`);
        });

        if (i % BATCH === 0) {
            await new Promise((r) => setTimeout(r, 200));
        }
    }

    console.log(`\n  ${C.B}${C.g}All ${count} bots launched!${C.R}`);
    console.log(`  ${C.D}${"-".repeat(42)}${C.R}`);
    console.log(`  ${C.B}Commands:${C.R} mode random|fix N|none | round N | status | leave | exit`);
    console.log(`  ${C.D}${"-".repeat(42)}${C.R}\n`);

    rl.on("line", (input) => {
        const cmd = input.trim().toLowerCase();
        const parts = cmd.split(/\s+/);

        if (parts[0] === "mode") {
            const sub = parts[1];
            if (sub === "random") {
                manager.setMode("random");
                console.log(`  ${C.g}>> Mode: Random${C.R}\n`);
            } else if (sub === "fix" && parts[2]) {
                const choice = parseInt(parts[2]);
                if (!isNaN(choice) && choice >= 0 && choice <= 3) {
                    manager.setMode(`fix_${choice}`);
                    console.log(`  ${C.g}>> Mode: Fix #${choice}${C.R}\n`);
                } else {
                    console.log(`  ${C.r}Invalid choice (0-3)${C.R}\n`);
                }
            } else if (sub === "none") {
                manager.setMode("none");
                console.log(`  ${C.g}>> Mode: None${C.R}\n`);
            } else {
                console.log(`  ${C.r}Usage: mode random|fix N|none${C.R}\n`);
            }
        } else if (parts[0] === "round" && parts[1]) {
            const choice = parseInt(parts[1]);
            if (!isNaN(choice) && choice >= 0 && choice <= 3) {
                manager.setRound(choice);
                console.log(`  ${C.g}>> Next question: ALL bots pick #${choice}${C.R}\n`);
            } else {
                console.log(`  ${C.r}Invalid choice (0-3)${C.R}\n`);
            }
        } else if (cmd === "status") {
            console.log(
                `\n  Online: ${C.B}${manager.joinedCount}/${count}${C.R} | Mode: ${C.B}${manager.modeLabel()}${C.R}\n`,
            );
        } else if (cmd === "leave") {
            console.log(`\n  ${C.y}Sending all ${manager.bots.length} bots to leave...${C.R}\n`);
            for (const bot of manager.bots) {
                try { bot.client.leave(); } catch (e) { /* ignore */ }
            }
            console.log(`  ${C.g}All bots left. Ciao!${C.R}\n`);
            process.exit(0);
        } else if (cmd === "exit") {
            console.log(`\n  ${C.y}Shutting down... Ciao!${C.R}\n`);
            process.exit(0);
        } else if (cmd !== "") {
            console.log(`  ${C.r}Unknown: "${input.trim()}". Try: mode, round, status, leave, exit${C.R}\n`);
        }
    });

    process.on("SIGINT", () => {
        console.log(`\n\n  ${C.y}Shutting down... Ciao!${C.R}\n`);
        process.exit(0);
    });
}

main().catch(console.error);
