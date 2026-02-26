# Build and Run a Taiko Node from Source

Guide for building `taiko-geth` and `taiko-client` from source and running them manually. Use this when you need a custom architecture or want to inspect the source.

## Prerequisites

| Dependency | Version |
|------------|---------|
| git | `^2` |
| Go | `^1.21` |
| make | `^4` |

## Build taiko-geth (Execution Engine)

```bash
git clone https://github.com/taikoxyz/taiko-geth.git
cd taiko-geth
git checkout <release-tag>   # From https://github.com/taikoxyz/taiko-geth/releases
make geth
```

## Build taiko-client (Consensus Client)

```bash
git clone https://github.com/taikoxyz/taiko-mono.git
cd taiko-mono/packages/taiko-client
git checkout <release-tag>   # From https://github.com/taikoxyz/taiko-mono/releases
make build
```

Check release notes carefully — some releases are specific to Alethia or Hoodi.

## Generate JWT Secret

taiko-geth and taiko-client communicate via the Ethereum Engine API, secured by a shared JWT secret:

```bash
openssl rand -hex 32 > jwt.txt
```

Copy `jwt.txt` to both the `taiko-geth` and `taiko-client` directories.

## Run on Alethia Mainnet

### Start taiko-geth

Start taiko-geth **before** taiko-client (fewer error messages).

```bash
./build/bin/geth \
  --taiko \
  --networkid 167000 \
  --gcmode archive \
  --datadir ./data/taiko-geth \
  --metrics \
  --metrics.expensive \
  --metrics.addr "0.0.0.0" \
  --bootnodes enode://7a8955b27eda2ddf361b59983fce9c558b18ad60d996ac106629f7f913247ef13bc842c7cf6ec6f87096a3ea8048b04873c40d3d873c0276d38e222bddd72e88@43.153.44.186:30303,enode://704a50da7e727aa10c45714beb44ece04ca1280ad63bb46bb238a01bf55c19c9702b469fb12c63824fa90f5051f7091b1c5069df1ec9a0ba1e943978c09d270f@49.51.202.127:30303,enode://f52e4e212a15cc4f68df27282e616d51d7823596c83c8c8e3b3416d7ab531cefc7b8a493d01964e1918315e6b0c7a4806634aeabb9013642a9159a53f4ebc094@43.153.16.47:30303,enode://57f4b29cd8b59dc8db74be51eedc6425df2a6265fad680c843be113232bbe632933541678783c2a5759d65eac2e2241c45a34e1c36254bccfe7f72e52707e561@104.197.107.1:30303,enode://87a68eef46cc1fe862becef1185ac969dfbcc050d9304f6be21599bfdcb45a0eb9235d3742776bc4528ac3ab631eba6816e9b47f6ee7a78cc5fcaeb10cd32574@35.232.246.122:30303 \
  --authrpc.addr "0.0.0.0" \
  --authrpc.port 28551 \
  --authrpc.vhosts "*" \
  --authrpc.jwtsecret ./jwt.txt \
  --http \
  --http.api admin,debug,eth,net,web3,txpool,miner,taiko \
  --http.addr "0.0.0.0" \
  --http.port 28545 \
  --http.vhosts "*" \
  --ws \
  --ws.api admin,debug,eth,net,web3,txpool,miner,taiko \
  --ws.addr "0.0.0.0" \
  --ws.port 28546 \
  --ws.origins "*" \
  --gpo.defaultprice "10000000" \
  --port 30304 \
  --syncmode full \
  --state.scheme=path
```

### Start taiko-client (Alethia)

```bash
export L1_WS=ws://<YOUR_L1_NODE>:8546
export L1_BEACON_URL=http://<YOUR_L1_NODE>:5052

./bin/taiko-client driver \
  --l1.ws ${L1_WS} \
  --l2.ws ws://localhost:28546 \
  --l1.beacon ${L1_BEACON_URL} \
  --l2.auth http://localhost:28551 \
  --taikoInbox 0x06a9Ab27c7e2255df1815E6CC0168d7755Feb19a \
  --taikoAnchor 0x1670000000000000000000000000000000010001 \
  --preconfirmation.whitelist 0xFD019460881e6EeC632258222393d5821029b2ac \
  --preconfirmation.serverPort 9871 \
  --jwtSecret ./jwt.txt \
  --p2p.sync \
  --p2p.checkPointSyncUrl https://rpc.mainnet.taiko.xyz \
  --p2p.bootnodes enode://c263741b17759f3850d24d67d6c3cbc307c73e17d80c6b12a63a4792a10529d1125d00ecf7ef4c9b0dc51d28b94dfc1b8798fb524f61a1f93946748649f73b23@34.142.239.251:4001?discport=30304,enode://2f37c3affd83274b262fa2a259d32d41510dd5a48d6e916696efe7f1598cb3f905305f5989e7b6607aab50697fb2e52cb4b6904116ed67cc5fcea1e6d66ccaba@35.247.159.156:4001?discport=30304,enode://dd83dedeff622ecfca0c5edf320266506c811539a553ddd91589cdfcc9bbd74d0d620f251d8d5e1180f19a446abbdd8b6b5301e9aa6cbad35cfd9716f80f2416@34.126.90.255:4001?discport=30304 \
  --p2p.listen.ip 0.0.0.0 \
  --p2p.useragent taiko \
  --p2p.listen.tcp 4001 \
  --p2p.advertise.tcp 4001 \
  --p2p.listen.udp 30303 \
  --p2p.advertise.tcp 30303 \
  --p2p.peerstore.path /node-keys/peerstore \
  --p2p.discovery.path /node-keys/discv5 \
  --p2p.advertise.ip ${YOUR_EXTERNAL_IP} \
  --p2p.priv.raw ${PRIVATE_KEY}
```

## Run on Hoodi Testnet

### Start taiko-geth (Hoodi)

```bash
./build/bin/geth \
  --taiko \
  --networkid 167013 \
  --gcmode archive \
  --datadir ./data/taiko-geth \
  --metrics \
  --metrics.expensive \
  --metrics.addr "0.0.0.0" \
  --bootnodes enode://eb5079aae185d5d8afa01bfd2d349da5b476609aced2b57c90142556cf0ee4a152bcdd724627a7de97adfc2a68af5742a8f58781366e6a857d4bde98de6fe986@34.44.53.195:30303,enode://b054002f068f30568aad39271462c053463edb4a3d3c19b71b475fa044805d7e2fda39c482eba183f9d1f76fb579a8e47c0c054bb819c2bbcb331c0aac7464c2@34.27.167.246:30303 \
  --authrpc.addr "0.0.0.0" \
  --authrpc.port 28551 \
  --authrpc.vhosts "*" \
  --authrpc.jwtsecret ./jwt.txt \
  --http \
  --http.api admin,debug,eth,net,web3,txpool,miner,taiko \
  --http.addr "0.0.0.0" \
  --http.port 28545 \
  --http.vhosts "*" \
  --ws \
  --ws.api admin,debug,eth,net,web3,txpool,miner,taiko \
  --ws.addr "0.0.0.0" \
  --ws.port 28546 \
  --ws.origins "*" \
  --gpo.ignoreprice "100000000" \
  --port 30304 \
  --syncmode full \
  --state.scheme=path
```

### Start taiko-client (Hoodi)

```bash
export L1_WS=ws://<YOUR_L1_HOODI_NODE>:8546
export L1_BEACON_URL=http://<YOUR_L1_HOODI_NODE>:5052

./bin/taiko-client driver \
  --l1.ws ${L1_WS} \
  --l2.ws ws://localhost:28546 \
  --l1.beacon ${L1_BEACON_URL} \
  --l2.auth http://localhost:28551 \
  --taikoInbox 0xf6eA848c7d7aC83de84db45Ae28EAbf377fe0eF9 \
  --taikoAnchor 0x1670130000000000000000000000000000010001 \
  --preconfirmation.whitelist 0x83AE31678B9f255346Af4636B4726A84c3bD2886 \
  --preconfirmation.serverPort 9871 \
  --jwtSecret ./jwt.txt \
  --p2p.sync \
  --p2p.checkPointSyncUrl https://rpc.hoodi.taiko.xyz \
  --p2p.bootnodes enode://ea5b8a797985f500afa37ba03ce47b0039792a942f0ac9bee9fa19a7a5410273fe43b4e8a9a28fa42cdec1b6435deb809fcb79479c55cc2ddbaf02de7a83f456@35.239.142.239:4001?discport=30304,enode://404e9493066107431bdf3f47bbb360a353244a6069903c76928fca3067575f2adf62ef396b0a8a74696669ef53cab8373e38ddd9b3d3d2d76f356d2cd2708951@34.63.118.244:4001?discport=30304,enode://b2d094ade1ce68990878b197bf818bd41d5b32e4019d42dc63d91d7020f531532f063833e44e84f78792969f69fd5553370216703c40fcc0cb835f17177fbe07@34.63.52.157:4001?discport=30304 \
  --p2p.listen.ip 0.0.0.0 \
  --p2p.useragent taiko \
  --p2p.listen.tcp 4001 \
  --p2p.advertise.tcp 4001 \
  --p2p.listen.udp 30303 \
  --p2p.advertise.tcp 30303 \
  --p2p.peerstore.path /node-keys/peerstore \
  --p2p.discovery.path /node-keys/discv5 \
  --p2p.advertise.ip ${YOUR_EXTERNAL_IP} \
  --p2p.priv.raw ${PRIVATE_KEY}
```

## Without Preconfirmations P2P

To run without joining the P2P network, remove all `--p2p.*` and `--preconfirmation.*` flags **except**:
- `--p2p.sync`
- `--p2p.checkPointSyncUrl`

Note: your node's chain head will lag behind preconfirmed blocks.

## P2P Configuration Notes

- `YOUR_EXTERNAL_IP`: Must be publicly accessible at the advertised TCP/UDP ports
  - Personal machine: `curl ifconfig.me`
  - Kubernetes: set a static IP for your LoadBalancer service
- `PRIVATE_KEY`: 32-byte hex private key for stable peer ID — does not need funds
  - Alternative: `--p2p.priv.path` pointing to a file with the key
- If you don't want to set IP manually, replace all `--p2p.listen.*` and `--p2p.advertise.*` flags with `--p2p.nat` for automatic NAT traversal (not recommended for production)
