import {  PublicKey } from '@solana/web3.js';

export class TokenAccount {
    publicKey!: PublicKey;
    mint!: PublicKey;
    owner!: PublicKey;
    amount!: number;

    constructor(publicKey: PublicKey, decoded: any) {
        this.publicKey = publicKey;
        Object.assign(this, decoded);
    }
}



