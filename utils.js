import { Keypair, TextEncoder } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

export const signTransaction = (pk) => {
    const keypair = Keypair.fromSecretKey(bs58.decode(pk));
    const timestamp = Date.now().toString();
    const message = new TextEncoder().encode(`Sign in to pump.fun: ${timestamp}`);

    // Sign the transaction
    const signature = nacl.sign.detached(message, keypair.secretKey);

    // Encode the signature in base58
    return bs58.encode(signature);
};

const createWallet = () => {
    // Generate a new random keypair
    const newKeypair = Keypair.generate();

    const publicKey = newKeypair.publicKey.toBase58();
    const secretKey = [...newKeypair.secretKey];
    const secretKeyBase58 = bs58.encode(Uint8Array.from(secretKey));

    const walletData = {
        publicKey: publicKey,
        secretKey: secretKey,
        secretKeyBase58: secretKeyBase58
    };

    return walletData;
};

export const createWallets = (amt) =>
    Promise.all(Array.from({ length: amt }, () => createWallet().publicKey.toBase58()));
