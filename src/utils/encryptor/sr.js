// Code in this file is heavily derived from the approach outlined in this PR:
// https://github.com/polkadot-js/common/pull/1331

import { assert, u8aCmp, u8aConcat, u8aToU8a } from "@polkadot/util";
import {
  hmacSha256AsU8a,
  naclDecrypt,
  naclEncrypt,
  pbkdf2Encode,
  randomAsU8a,
  sr25519Agreement
} from "@polkadot/util-crypto";

const publicKeySize = 32;
const macValueSize = 32;

const encryptionKeySize = 32;
const macKeySize = 32;
const derivationKeyRounds = 2048;

const keyDerivationSaltSize = 32;
const nonceSize = 24;

function sr25519DecapsulateEncryptedMessage(encryptedMessage) {
  assert(
    encryptedMessage.byteLength >
      nonceSize + keyDerivationSaltSize + publicKeySize + macValueSize,
    "Wrong encrypted message length"
  );
  return {
    ephemeralPublicKey: encryptedMessage.slice(
      nonceSize + keyDerivationSaltSize,
      nonceSize + keyDerivationSaltSize + publicKeySize
    ),
    keyDerivationSalt: encryptedMessage.slice(
      nonceSize,
      nonceSize + keyDerivationSaltSize
    ),
    macValue: encryptedMessage.slice(
      nonceSize + keyDerivationSaltSize + publicKeySize,
      nonceSize + keyDerivationSaltSize + publicKeySize + macValueSize
    ),
    nonce: encryptedMessage.slice(0, nonceSize),
    sealed: encryptedMessage.slice(
      nonceSize + keyDerivationSaltSize + publicKeySize + macValueSize
    )
  };
}

function generateEncryptionKey(senderKeyPair, receiverPublicKey) {
  const { encryptionKey, keyDerivationSalt, macKey } =
    buildSR25519EncryptionKey(
      receiverPublicKey,
      senderKeyPair.secretKey,
      senderKeyPair.publicKey
    );

  return {
    encryptionKey,
    keyDerivationSalt,
    macKey
  };
}

function buildSR25519EncryptionKey(
  publicKey,
  secretKey,
  encryptedMessagePairPublicKey,
  salt = randomAsU8a(keyDerivationSaltSize)
) {
  const agreementKey = sr25519Agreement(secretKey, publicKey);
  const masterSecret = u8aConcat(encryptedMessagePairPublicKey, agreementKey);

  return deriveKey(masterSecret, salt);
}

function deriveKey(masterSecret, salt) {
  const { password } = pbkdf2Encode(masterSecret, salt, derivationKeyRounds);

  assert(
    password.byteLength >= macKeySize + encryptionKeySize,
    "Wrong derived key length"
  );

  return {
    encryptionKey: password.slice(macKeySize, macKeySize + encryptionKeySize),
    keyDerivationSalt: salt,
    macKey: password.slice(0, macKeySize)
  };
}

function macData(
  nonce,
  encryptedMessage,
  encryptedMessagePairPublicKey,
  macKey
) {
  return hmacSha256AsU8a(
    macKey,
    u8aConcat(nonce, encryptedMessagePairPublicKey, encryptedMessage)
  );
}

export function decryptMessage(encryptedMessageWithNonce, secretKey) {
  const { ephemeralPublicKey, keyDerivationSalt, macValue, nonce, sealed } =
    sr25519DecapsulateEncryptedMessage(u8aToU8a(encryptedMessageWithNonce));
  const { encryptionKey, macKey } = buildSR25519EncryptionKey(
    ephemeralPublicKey,
    u8aToU8a(secretKey),
    ephemeralPublicKey,
    keyDerivationSalt
  );
  const decryptedMacValue = macData(nonce, sealed, ephemeralPublicKey, macKey);

  assert(u8aCmp(decryptedMacValue, macValue) === 0, "Mac values don't match");

  return naclDecrypt(sealed, nonce, encryptionKey);
}

export function encryptMessage(message, recipientPublicKey, senderKeyPair) {
  const { encryptionKey, keyDerivationSalt, macKey } = generateEncryptionKey(
    messageKeyPair,
    recipientPublicKey
  );
  const { encrypted, nonce } = naclEncrypt(
    u8aToU8a(message),
    encryptionKey,
    randomAsU8a(nonceSize)
  );
  const macValue = macData(nonce, encrypted, senderKeyPair.publicKey, macKey);

  return u8aConcat(
    nonce,
    keyDerivationSalt,
    senderKeyPair.publicKey,
    macValue,
    encrypted
  );
}
