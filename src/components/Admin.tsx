import useQuasarStore from '../stores/useQuasarStore'
import ConnectWalletButton from './ConnectWalletButton'

import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Account, Connection, Commitment, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { Cluster, Config, MangoClient, sleep, MangoAccountLayout } from '@blockworks-foundation/mango-client';
import configFile from '../ids.json';


const Admin = () => {
    const connected = useQuasarStore((s) => s.wallet.connected)
    const publicKey = useQuasarStore((s) => s.wallet.current?.publicKey)

    async function test() {
        const connection = new Connection("https://mango.devnet.rpcpool.com", 'singleGossip');

        console.log("test")

        const groupName = 'devnet.2'
        const cluster = 'devnet' as Cluster
        const config = new Config(configFile)
        const groupIds = config.getGroup(cluster, groupName)

        if (!groupIds) {
            throw new Error(`Group ${groupName} not found`)
        }
        const quasarProgramId = 'rDcBAK5ozkRwJC5bgM8rwtMjjW6oZPBmzgV6jUu9QJf'
        const mangoProgramId = groupIds.mangoProgramId
        const mangoGroupKey = groupIds.publicKey
        console.log(mangoProgramId.toString());

        const payer = new Account(
            [32, 200, 206, 106, 153, 231, 232, 130, 250, 66, 207, 147, 149, 21, 133, 157, 38, 34, 218, 61, 182, 104, 55, 200, 233, 242, 152, 109, 204, 175, 200, 92, 27, 227, 114, 155, 125, 10, 36, 159, 242, 75, 189, 199, 203, 7, 205, 195, 20, 13, 60, 85, 136, 231, 255, 20, 80, 105, 245, 100, 182, 90, 248, 241]);
        const newAccount = new Account();
        // console.log(newAccount.secretKey);

        const instruction = new TransactionInstruction({
            programId: new PublicKey(quasarProgramId),
            keys: [
                { pubkey: payer.publicKey, isSigner: true, isWritable: false },
                { pubkey: new PublicKey(quasarProgramId), isSigner: false, isWritable: false },
                { pubkey: newAccount.publicKey, isSigner: true, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            data: Buffer.from(Uint8Array.of(5, 0, 0, 0))
        })

        try {
            const tx = new Transaction().add(instruction);
            console.log("tx sig: ", await connection.sendTransaction(tx, [payer, newAccount], { skipPreflight: false, preflightCommitment: 'singleGossip' }));
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <>
            <div>
                Admin page

                <div>
                    <button onClick={() => test()}
                    >
                        test
                    </button>
                </div>
            </div>
        </>
    )
}

export default Admin
