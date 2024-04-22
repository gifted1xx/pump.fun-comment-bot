// Comment Exploit for Pump.Fun
// Author: Gifted1x
// Date: 2024-04-22

import chalk from "chalk";
import comments from "./comments.json" assert { type: "json" };
import axios from "axios";

import { createWallets, signTransaction } from "./utils";

const login = async (keypair) => {
    const signedMessage = signTransaction(keypair.secretKeyBase58);
    const timestamp = Date.now().toString();

    // Setup payload
    const payload = {
        address: keypair.publicKey,
        signature: signedMessage,
        timestamp: timestamp
    };

    try {
        const response = await axios.post("https://client-api-2-74b1891ee9f9.herokuapp.com/auth/login", payload);
        if (response && response.data && response.data.access_token) {
            // JWT retrieved
            const jwt = response.data.access_token;
            return jwt;
        } else {
            throw new Error("Invalid response from the authentication server.");
        }
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

const comment = async (target, commentToLeave, index, jwt) => {
    const url = "https://client-api-2-74b1891ee9f9.herokuapp.com/replies";

    if (!jwt) {
        throw new Error("No jwt found, please run setup");
    }

    const resp = await axios({
        url,
        method: "POST",
        data: {
            mint: target,
            text: commentToLeave
        },
        headers: {
            Authorization: `Bearer ${jwt}`
        }
    });

    return resp.data;
};

const leaveComments = async (target, amount, batchSize = 5, delayMs = 5000) => {
    try {
        console.log(chalk.green(`Creating ${amount} wallets...`));
        const wallets = await createWallets(amount);

        console.log(chalk.green.bold(`Successfully created ${amount} wallets.`));
        console.log(chalk.cyan.bold("Faking pump.fun logins..."));
        const jwts = await Promise.all(
            wallets.map((wallet) =>
                login(wallet.publicKey, wallet.secretKeyBase58).then((jwt) => {
                    if (!jwt) throw new Error("Failed to get JWT, please check your credentials");
                    return jwt;
                })
            )
        );

        console.log(chalk.cyan.bold("Successfully faked logins."));
        console.log(chalk.green.bold("Leaving comments..."));

        for (let i = 0; i < jwts.length; i += batchSize) {
            const batch = jwts.slice(i, i + batchSize);
            console.log(chalk.cyan(`Processing batch...`));

            batch.map(async (jwt, cmtIdx) => {
                const commentIndex = i + cmtIdx;
                const commentToLeave = comments[commentIndex % comments.length];
                return comment(target, commentToLeave, commentIndex, jwt)
                    .then(() => console.log(chalk.cyan(`Commented ${commentToLeave} on ${target} 🚀`)))
                    .catch((error) => console.error(`Failed to comment:`, error));
            });

            // Wait for the current batch to finish before proceeding
            await Promise.all(batchPromises);

            if (i + batchSize < jwts.length) {
                // Check if there is a next batch
                console.log(chalk.cyan(`Waiting ${delayMs} milliseconds before next batch...`));
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    } catch (e) {
        console.error(chalk.red(`Error: ${e}`));
    }
};

// Usage
const target = "YOUR_TARGET_MINT_PUMP_FUN_ADDY";
const amount = 100;
const batchSize = 5;
const delayMs = 5000;

leaveComments(target, amount, batchSize, delayMs);
