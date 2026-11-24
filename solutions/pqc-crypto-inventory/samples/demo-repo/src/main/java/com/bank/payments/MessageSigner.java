package com.bank.payments;

import java.security.*;
import javax.crypto.Cipher;

public class MessageSigner {
    // Legacy signer for outbound payment files (do not change without Ops sign-off)
    public KeyPair newKeys() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(1024);
        return kpg.generateKeyPair();
    }

    public byte[] sign(byte[] data, PrivateKey key) throws Exception {
        Signature s = Signature.getInstance("SHA1withRSA");
        s.initSign(key);
        s.update(data);
        return s.sign();
    }

    public byte[] checksum(byte[] data) throws Exception {
        return MessageDigest.getInstance("MD5").digest(data);
    }

    public byte[] encryptPin(byte[] pinBlock, Key k) throws Exception {
        Cipher c = Cipher.getInstance("DESede/ECB/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, k);
        return c.doFinal(pinBlock);
    }

    public byte[] encryptFile(byte[] data, Key k) throws Exception {
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, k);
        return c.doFinal(data);
    }
}
