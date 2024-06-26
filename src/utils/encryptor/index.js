import {
  ed25519PairFromSeed,
  encodeAddress,
  mnemonicToMiniSecret,
  sr25519PairFromSeed
} from "@polkadot/util-crypto";
import {
  decryptMessage as decryptMessageEd,
  encryptMessage as encryptMessageEd
} from "./ed";
import {
  decryptMessage as decryptMessageSr,
  encryptMessage as encryptMessageSr
} from "./sr";

export function createPair(mnemonic, type = "ed25519") {
  const seed = mnemonicToMiniSecret(mnemonic);
  if (type === "sr25519") {
    return { pair: sr25519PairFromSeed(seed), type };
  }
  return { pair: ed25519PairFromSeed(seed), type };
}
export function encryptor(pair, type = "ed25519") {
  if (pair.type) {
    type = pair.type;
    pair = pair.pair;
  }
  return {
    pair,
    type,
    address: encodeAddress(pair.publicKey, 32),
    encodeAddress: (ss58Format = 32) => {
      return encodeAddress(pair.publicKey, ss58Format);
    },
    decryptMessage: (encryptedMessageWithNonce, senderPublicKey) => {
      if (type === "sr25519") {
        return decryptMessageSr(encryptedMessageWithNonce, pair.secretKey);
      }
      return decryptMessageEd(
        encryptedMessageWithNonce,
        senderPublicKey,
        pair.secretKey
      );
    },
    encryptMessage: (message, recipientPublicKey, nonce) => {
      if (type === "sr25519") {
        return encryptMessageSr(message, recipientPublicKey, pair);
      }
      return encryptMessageEd(
        message,
        recipientPublicKey,
        pair.secretKey,
        nonce
      );
    }
  };
}
