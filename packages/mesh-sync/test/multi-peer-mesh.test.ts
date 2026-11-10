import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveKey, computeWorkspaceFingerprint } from '../src/crypto/cipher.js';
import { CRDTDocManager } from '../src/crdt/doc.js';
import { CRDTCollection } from '../src/collection/collection.js';
import { computeIpfsCid } from '../src/relay/ipfs-relay.js';
import { encryptPayload, decryptPayload } from '../src/crypto/cipher.js';

describe('Multi-Peer CRDT Mesh Simulation & Convergence', () => {
  interface SharedExpense {
    id: string;
    description: string;
    amount: number;
    payer: string;
  }

  test('3 concurrent peers perform disconnected offline edits and converge symmetrically', async () => {
    const workspaceId = 'trip-kyoto-2026';
    const passphrase = 'local-first-mesh-secret';
    const key = await deriveKey(passphrase, workspaceId);
    const fingerprint = await computeWorkspaceFingerprint(workspaceId, passphrase);

    // Initialize 3 independent peer document managers
    const peerA = new CRDTDocManager(workspaceId);
    const peerB = new CRDTDocManager(workspaceId);
    const peerC = new CRDTDocManager(workspaceId);

    const colA = new CRDTCollection<SharedExpense>('expenses', peerA);
    const colB = new CRDTCollection<SharedExpense>('expenses', peerB);
    const colC = new CRDTCollection<SharedExpense>('expenses', peerC);

    // Track reactive observations
    let peerAItems: SharedExpense[] = [];
    let peerBItems: SharedExpense[] = [];
    let peerCItems: SharedExpense[] = [];

    colA.observe((items) => { peerAItems = items; });
    colB.observe((items) => { peerBItems = items; });
    colC.observe((items) => { peerCItems = items; });

    // Step 1: Disconnected / Partitioned phase:
    // Peer A records an expense offline
    colA.add({
      id: 'exp_1',
      description: 'Bullet Train Tickets',
      amount: 140,
      payer: 'Alice'
    });

    // Peer B records an expense offline concurrently
    colB.add({
      id: 'exp_2',
      description: 'Matcha Tea Ceremony',
      amount: 45,
      payer: 'Bob'
    });

    // Peer C records an expense offline concurrently
    colC.add({
      id: 'exp_3',
      description: 'Ryokan Stay',
      amount: 320,
      payer: 'Charlie'
    });

    // Before sync: each peer only knows their own local mutations
    assert.equal(colA.count(), 1);
    assert.equal(colB.count(), 1);
    assert.equal(colC.count(), 1);

    // Step 2: Peer A and Peer B meet and perform symmetric vector-clock reconciliation over encrypted wire:
    // A -> B: A sends state vector
    const vectorA = peerA.getStateVector();
    const envA = await encryptPayload(vectorA, key, fingerprint);

    // B receives and decrypts vector from A
    const decryptedVecA = await decryptPayload(envA, key);
    const deltaForA = peerB.getDelta(decryptedVecA);
    const envDeltaForA = await encryptPayload(deltaForA, key, fingerprint);

    // B -> A: B sends its own state vector to A
    const vectorB = peerB.getStateVector();
    const envB = await encryptPayload(vectorB, key, fingerprint);
    const decryptedVecB = await decryptPayload(envB, key);
    const deltaForB = peerA.getDelta(decryptedVecB);
    const envDeltaForB = await encryptPayload(deltaForB, key, fingerprint);

    // Both peers apply decrypted delta updates
    peerA.applyUpdate(await decryptPayload(envDeltaForA, key));
    peerB.applyUpdate(await decryptPayload(envDeltaForB, key));

    // Peer A and Peer B now converge on 2 items!
    assert.equal(colA.count(), 2);
    assert.equal(colB.count(), 2);
    assert.deepEqual(
      colA.getAll().map((e) => e.id).sort(),
      ['exp_1', 'exp_2']
    );

    // Step 3: Peer C rejoins the mesh and reconciles with Peer A
    const vectorC = peerC.getStateVector();
    const deltaCtoA = peerA.getDelta(vectorC);
    const deltaAtoC = peerC.getDelta(peerA.getStateVector());

    peerC.applyUpdate(deltaCtoA);
    peerA.applyUpdate(deltaAtoC);

    // Now Peer B reconciles with Peer C
    const deltaBtoC = peerC.getDelta(peerB.getStateVector());
    peerB.applyUpdate(deltaBtoC);

    // Final convergence verification: ALL 3 PEERS MUST HAVE EXACT IDENTICAL STATE
    assert.equal(colA.count(), 3);
    assert.equal(colB.count(), 3);
    assert.equal(colC.count(), 3);

    const sortedA = colA.getAll().sort((x, y) => x.id.localeCompare(y.id));
    const sortedB = colB.getAll().sort((x, y) => x.id.localeCompare(y.id));
    const sortedC = colC.getAll().sort((x, y) => x.id.localeCompare(y.id));

    assert.deepEqual(sortedA, sortedB);
    assert.deepEqual(sortedB, sortedC);

    // Step 4: Partial Concurrent Mutation Conflict Resolution
    // Both Alice and Bob update the note on exp_1 concurrently
    colA.update('exp_1', { amount: 150 });
    colB.update('exp_1', { description: 'Shinkansen Bullet Train' });

    // Sync updates between A and B
    const updateA = peerA.getDelta(peerB.getStateVector());
    const updateB = peerB.getDelta(peerA.getStateVector());

    peerB.applyUpdate(updateA);
    peerA.applyUpdate(updateB);

    // Conflict-free merge check:
    const itemA = colA.get('exp_1')!;
    const itemB = colB.get('exp_1')!;
    assert.equal(itemA.id, 'exp_1');
    assert.equal(itemB.id, 'exp_1');
    assert.equal(itemA.amount, itemB.amount);
    assert.equal(itemA.description, itemB.description);
  });

  test('asynchronous cold rehydration: peer D starts from scratch and rehydrates via IPFS snapshot', async () => {
    const workspaceId = 'cold-boot-test';
    const passphrase = 'cold-boot-passphrase';
    const key = await deriveKey(passphrase, workspaceId);

    // Peer A produces state
    const peerA = new CRDTDocManager(workspaceId);
    const colA = new CRDTCollection<SharedExpense>('expenses', peerA);
    colA.add({ id: 'cold_1', description: 'Car Rental', amount: 200, payer: 'Dave' });
    colA.add({ id: 'cold_2', description: 'Gas', amount: 50, payer: 'Dave' });

    // Export binary snapshot from Peer A
    const snapshotA = peerA.exportSnapshot();
    const encryptedSnapshot = await encryptPayload(snapshotA, key);
    const snapshotJson = JSON.stringify(encryptedSnapshot);
    const snapshotBytes = new TextEncoder().encode(snapshotJson);

    // Generate IPFS CIDv1
    const cid = await computeIpfsCid(snapshotBytes);
    assert.ok(cid.startsWith('bafkrei'));

    // Peer D joins later with an empty document and no peers online
    const peerD = new CRDTDocManager(workspaceId);
    const colD = new CRDTCollection<SharedExpense>('expenses', peerD);
    assert.equal(colD.count(), 0);

    // Simulate downloading encrypted block by CID from IPFS and decrypting
    const parsedEnvelope = JSON.parse(snapshotJson);
    const decryptedSnapshot = await decryptPayload(parsedEnvelope, key);

    // Rehydrate Peer D
    peerD.applyUpdate(decryptedSnapshot, 'ipfs-rehydration');

    // Peer D now has all items without ever talking to Peer A directly!
    assert.equal(colD.count(), 2);
    assert.equal(colD.get('cold_1')?.description, 'Car Rental');
    assert.equal(colD.get('cold_2')?.amount, 50);
  });
});
