import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveKey,
  encryptPayload,
  decryptPayload,
  computeWorkspaceFingerprint,
  sha256Hex
} from '../src/crypto/cipher.js';
import {
  parseHashCredentials,
  generateWorkspaceCredentials,
  formatHashCredentials
} from '../src/identity/credentials.js';
import { CRDTDocManager } from '../src/crdt/doc.js';
import { CRDTCollection } from '../src/collection/collection.js';
import { computeIpfsCid } from '../src/relay/ipfs-relay.js';

describe('Identity & Web Crypto Primitives', () => {
  test('generates and parses URL hash credentials (#workspaceId:passphrase)', () => {
    const creds = generateWorkspaceCredentials('test-ws');
    assert.ok(creds.workspaceId.startsWith('test-ws-'));
    assert.ok(creds.passphrase.length >= 8);

    const formatted = formatHashCredentials(creds);
    assert.ok(formatted.startsWith('#'));

    const parsed = parseHashCredentials(formatted);
    assert.deepEqual(parsed, creds);
  });

  test('derives 256-bit AES-GCM key with PBKDF2 and performs authenticated encryption', async () => {
    const passphrase = 'super-secret-passphrase';
    const workspaceId = 'workspace-alpha';

    const key = await deriveKey(passphrase, workspaceId);
    assert.ok(key);
    assert.equal(key.algorithm.name, 'AES-GCM');

    const plaintext = new TextEncoder().encode('Hello Zero-Server Mesh World!');
    const envelope = await encryptPayload(plaintext, key, 'fp-alpha');

    assert.equal(envelope.v, 1);
    assert.ok(envelope.iv.length > 0);
    assert.ok(envelope.data.length > 0);
    assert.equal(envelope.fp, 'fp-alpha');

    // Decrypt
    const decryptedBytes = await decryptPayload(envelope, key);
    const decryptedText = new TextDecoder().decode(decryptedBytes);
    assert.equal(decryptedText, 'Hello Zero-Server Mesh World!');
  });

  test('rejects tampered ciphertext due to AES-GCM authenticated tag', async () => {
    const key = await deriveKey('secret', 'ws-1');
    const plaintext = new TextEncoder().encode('Sensitive state payload');
    const envelope = await encryptPayload(plaintext, key);

    // Tamper with envelope data
    const tamperedEnvelope = {
      ...envelope,
      data: envelope.data.slice(0, -4) + 'AAAA'
    };

    await assert.rejects(
      async () => {
        await decryptPayload(tamperedEnvelope, key);
      },
      /operation failed|tag mismatch|tampering/i
    );
  });

  test('generates deterministic workspace routing fingerprint', async () => {
    const fp1 = await computeWorkspaceFingerprint('ws-1', 'secret-pass');
    const fp2 = await computeWorkspaceFingerprint('ws-1', 'secret-pass');
    const fp3 = await computeWorkspaceFingerprint('ws-2', 'secret-pass');

    assert.equal(fp1, fp2);
    assert.notEqual(fp1, fp3);
    assert.equal(fp1.length, 16);
  });
});

describe('CRDT Vector-Clock Reconciliation & Collections', () => {
  test('CRDTDocManager computes state vectors and exchanges missing delta diffs', () => {
    const docA = new CRDTDocManager('ws-crdt');
    const docB = new CRDTDocManager('ws-crdt');

    // Local edit on docA
    const mapA = docA.getMap<string>('test-map');
    mapA.set('key1', 'valueA');

    // Symmetric vector clock reconciliation
    const vectorB = docB.getStateVector();
    const deltaForB = docA.getDelta(vectorB);
    assert.ok(deltaForB.byteLength > 0);

    docB.applyUpdate(deltaForB);

    const mapB = docB.getMap<string>('test-map');
    assert.equal(mapB.get('key1'), 'valueA');

    // Concurrent edits converge
    mapA.set('concurrentA', 'fromA');
    mapB.set('concurrentB', 'fromB');

    const updateFromA = docA.getDelta(docB.getStateVector());
    const updateFromB = docB.getDelta(docA.getStateVector());

    docB.applyUpdate(updateFromA);
    docA.applyUpdate(updateFromB);

    assert.equal(mapA.get('concurrentB'), 'fromB');
    assert.equal(mapB.get('concurrentA'), 'fromA');
  });

  test('CRDTCollection supports add, update, delete, query, and reactive observe', () => {
    interface TestItem {
      id: string;
      name: string;
      value: number;
    }

    const docManager = new CRDTDocManager('ws-test');
    const collection = new CRDTCollection<TestItem>('items', docManager);

    let observedSnapshots: TestItem[][] = [];
    const unsubscribe = collection.observe((items) => {
      observedSnapshots.push(items);
    });

    const item1 = collection.add({ id: 'item_1', name: 'Alpha', value: 10 });
    assert.equal(item1.id, 'item_1');
    assert.equal(collection.count(), 1);

    const updated = collection.update('item_1', { value: 20 });
    assert.equal(updated?.value, 20);

    const queried = collection.query((i) => i.value >= 20);
    assert.equal(queried.length, 1);
    assert.equal(queried[0].name, 'Alpha');

    const deleted = collection.delete('item_1');
    assert.equal(deleted, true);
    assert.equal(collection.count(), 0);

    unsubscribe();
  });
});

describe('IPFS Content-Addressed Cold Storage', () => {
  test('computes standard IPFS CIDv1 (raw/sha2-256)', async () => {
    const payload = new TextEncoder().encode('IPFS content addressed snapshot data');
    const cid = await computeIpfsCid(payload);

    assert.ok(cid.startsWith('bafkrei'), `Expected CID to start with bafkrei, got ${cid}`);
  });
});
