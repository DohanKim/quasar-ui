import useQuasarStore from '../stores/useQuasarStore';
import ConnectWalletButton from './ConnectWalletButton';

import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  Account,
  Connection,
  Commitment,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import {
  Cluster,
  Config,
  MangoClient,
  sleep,
  MangoAccountLayout,
} from '@blockworks-foundation/mango-client';
import configFile from '../ids.json';
import { mangoProgramId } from '../stores/useQuasarStore';
import { notify } from '../utils/notifications';

const Admin = () => {
  const connected = useQuasarStore((s) => s.wallet.connected);
  const publicKey = useQuasarStore((s) => s.wallet.current?.publicKey);

  const quasarClient = useQuasarStore((s) => s.connection.client);

  const initQuasarGroup = async () => {
    const wallet = useQuasarStore.getState().wallet.current;

    try {
      const quasarGroupPk = await quasarClient.initQuasarGroup(
        mangoProgramId,
        wallet
      );
      notify({
        title: 'quasar group initialized',
      });

      console.log(await quasarClient.getQuasarGroup(quasarGroupPk));
    } catch (err) {
      console.warn('Error setting account name:', err);
      notify({
        title: 'Could not initialize quasar group',
        description: `${err}`,
        type: 'error',
      });
    }
  };

  return (
    <>
      <div>
        Admin page
        <div>
          <button onClick={() => initQuasarGroup()}>init quasar group</button>
        </div>
      </div>
    </>
  );
};

export default Admin;
