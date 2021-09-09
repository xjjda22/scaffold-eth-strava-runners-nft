import { Row, Col, Layout, Card, Space, Divider, Radio, Input, Button, Table, Alert, List } from "antd";
import "antd/dist/antd.css";
import "./App.css";
import React, { useCallback, useEffect, useState } from "react";
// import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import axios from "axios";

import { 
  Address, 
  // AddressInput, 
  HeaderSt, 
  StravaActivityMap 
} from "./components";
import { 
  useUserProvider,
  useContractLoader,
  useContractReader,
  useEventListener,
  // useBalance,
  useOnBlock, 
  usePoller 
} from "./hooks";
import { useUserAddress } from "eth-hooks";
import { Transactor } from "./helpers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import LZ from "lz-string";

import { INFURA_ID, NETWORK, NETWORKS } from "./constants";

const { ethers } = require("ethers");
const { BufferList } = require("bl");
const ipfsAPI = require("ipfs-http-client");

const { Header, Footer, Content } = Layout;

// 😬 Sorry for all the console logging
// const DEBUG = true;
const showBroswerRouter = true;

const targetNetwork = NETWORKS["localhost"]; 
const localProviderUrl = targetNetwork.rpcUrl;
const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });

//helper function to "Get" from IPFS
// you usually go content.toString() after this...
const getFromIPFS = async hashToGet => {
  for await (const file of ipfs.get(hashToGet)) {
    console.log(file.path);
    if (!file.content) continue;
    const content = new BufferList();
    for await (const chunk of file.content) {
      content.append(chunk);
    }
    console.log(content);
    return content;
  }
};

const fromWei = i => {
  return i / 10 ** 18;
};
const fromGWei = i => {
  return i / 10 ** 9;
};
const toGWei = i => {
  return i * 10 ** 9;
};
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrl);
const mainnetInfura = new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID);

function App(props) {
  const mainnetProvider = mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();

  const [gasPrices, setGasPrices] = useState({});
  const [gas, setGas] = useState(0);
  const [gasEth, setGasEth] = useState(0);
  const [gasUsd, setGasUsd] = useState(0);
  const [gasLimit, setGasLimit] = useState(30000);
  const [ethPrice, setEthPrice] = useState(0);

  const [blockNum, setBlockNum] = useState(0);
  const [Loading, setLoading] = useState(0);

  const [transferToAddresses, setTransferToAddresses] = useState({});
  const [yourCollectibles, setYourCollectibles] = useState();

  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);
  const tx = Transactor(userProvider, gas);
  const faucetTx = Transactor(userProvider, gas);

  const readContracts = useContractLoader(userProvider);
  const writeContracts = useContractLoader(userProvider);

  //   // keep track of a variable from the contract in the local React state:
  // const balance = useContractReader(
  //   readContracts,
  //   "YourCollectible",
  //   "balanceOf",
  //   [address],
  //   process.env.REACT_APP_POLLING,
  // );

  //📟 Listen for broadcast events
  const transferEvents = useEventListener(readContracts, "YourCollectible", "Transfer", userProvider, 1);
  // console.log("📟 Transfer events:", transferEvents);

  // const yourBalance = balance && balance.toNumber && balance.toNumber();
  

  // useEffect(() => {
  //   const updateYourCollectibles = async () => {
  //     let collectibleUpdate = [];
  //     for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
  //       try {
  //         console.log("GEtting token index", tokenIndex);
  //         const tokenId = await readContracts.YourCollectible.tokenOfOwnerByIndex(address, tokenIndex);
  //         console.log("tokenId", tokenId);
  //         const tokenURI = await readContracts.YourCollectible.tokenURI(tokenId);
  //         console.log("tokenURI", tokenURI);

  //         const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
  //         console.log("ipfsHash", ipfsHash);

  //         const jsonManifestBuffer = await getFromIPFS(ipfsHash);

  //         try {
  //           let jsonManifest = JSON.parse(jsonManifestBuffer.toString());
  //           jsonManifest.savedDrawing = await LZ.decompress(jsonManifest.savedDrawing);
  //           jsonManifest.savedDrawingBack = await LZ.decompress(jsonManifest.savedDrawingBack);
  //           jsonManifest.bm = "run🏃🏽‍♂nft";

  //           // jsonManifest.profile = "";
  //           // let _i = new window.Image();
  //           // _i.src = jsonManifest.profile;
  //           // _i.onload = async () => {
  //           //   jsonManifest.profile = _i;
  //           // };

  //           // console.log("jsonManifest", jsonManifest);
  //           console.log("jsonManifest", JSON.parse(jsonManifest.savedDrawing));
  //           collectibleUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
  //         } catch (e) {
  //           console.log(e);
  //         }
  //       } catch (e) {
  //         console.log(e);
  //       }
  //     }
  //     setYourCollectibles(collectibleUpdate);
  //   };
  //   updateYourCollectibles();
  // }, [address, yourBalance]);

  let networkDisplay = "";
  networkDisplay = (
    <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
      {targetNetwork.name}
    </div>
  );

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const faucetAvailable = true;

  const ethgasAPI = "https://ethgasstation.info/json/ethgasAPI.json";
  const uniswapV2GQL = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";
  const ethQL = `{
    bundles (first:1) {
      ethPrice
    }
  }`;

  const getEthPrice = () => {
    axios
      .post(uniswapV2GQL, { query: ethQL })
      .then(response => {
        const { data } = response;
        const {
          data: { bundles },
        } = data;
        if (bundles.length > 0) {
          const ep = parseFloat(bundles[0].ethPrice).toFixed(6);
          setEthPrice(ep);
          calcUsd();
        }
      })
      .catch(error => console.log(error));
  };

  const gasConverter = g => {
    const gm = g * 100000000;
    const gd = parseInt(gm, 10) / 10 ** 9;
    return gd;
  };

  const getGasPrices = () => {
    axios
      .get(ethgasAPI)
      .then(response => {
        const { data } = response;
        const { average, fast, fastest } = data;
        const gasObj = {
          average: gasConverter(average),
          fast: gasConverter(fast),
          fastest: gasConverter(fastest),
        };
        setGasPrices(gasObj);
        setGas(gasObj.fast);
        calcUsd();
      })
      .catch(error => console.log(error));
  };

  const calcUsd = () => {
    if (ethPrice < 0 || gas < 0) return;
    const fg = toGWei(gas);
    const gm = fromWei(fg * gasLimit);
    const u = parseFloat(gm * ethPrice).toFixed(6);
    if (gm > 0) setGasEth(gm);
    if (u > 0) setGasUsd(u);
  };

  const init = () => {
    getEthPrice();
    getGasPrices();
  };

  useOnBlock(mainnetProvider, async () => {
    await setLoading(0);
    // console.log(mainnetProvider)
    const bn = await mainnetProvider._lastBlockNumber;
  
    setBlockNum(bn);

    init();
    await setLoading(1);
  });
  // usePoller(init, 10000);

  return (
    <div className="App">
      <Layout>
        <Header
          style={{ padding: 5, position: "fixed", zIndex: 1, width: "100%", height: "auto", top: 0 }}
        >
          <HeaderSt />
          <Space></Space>
        </Header>
        <Content style={{ paddingTop: 150, paddingBottom: 50, width: "100%" }} className="">
          <div
            style={{
              width: 800,
              margin: "auto",
              marginTop: 10,
              paddingTop: 15,
              paddingBottom: 15,
              fontWeight: "bolder",
              borderRadius: 12,
            }}
            class="grad_deeprelief"
          >
            <h3> ⚓ latest block num: {blockNum}</h3>
            <h3> 💲 current eth price: {ethPrice}</h3>
            <h3> ⛽️ selected gas : {gas} gwei</h3>
            <h3> gas limit : {gasLimit}</h3>
            <h3> ♦ gas cost (eth) : {gasEth}</h3>
            <h3> 💲 gas cost (usd) : {gasUsd}</h3>
            <Divider />
            
          </div>

          <div
            style={{
              width: 800,
              margin: "auto",
              marginTop: 10,
              padding: 10,
              fontWeight: "bolder",
              borderRadius: 12,
            }}
            class="grad_deeprelief"
          >
            <div> ****** </div>
            <div style={{ textAlign: "left" }}>
              
            </div>
          </div>
          <StravaActivityMap
            address={address}
            tx={tx}
            provider={userProvider}
            writeContracts={writeContracts}
            readContracts={readContracts}
          />

          <List
                header={<div>Mints</div>}
                bordered
                dataSource={yourCollectibles}
                renderItem={item => {
                  let id = item.id.toNumber();
                  return (
                    <List.Item key={id + "_" + item.uri + "_" + item.owner}>
                      <Card
                        title={
                          <div>
                            <span style={{ fontSize: 16, marginRight: 8 }}>#{id}</span> {item.name}
                          </div>
                        }
                      >
                        <div
                          id={"canvas_play_" + id}
                          style={{ width: 500, height: "100%", margin: "auto", marginTop: 10, paddingBottom: 10 }}
                        >
                        </div>
                        <div style={{ width: 500, height: "100%", margin: "auto", marginTop: 10, paddingBottom: 10 }}>
                          owner:{" "}
                          <Address
                            address={item.owner}
                            // ensProvider={mainnetProvider}
                            // blockExplorer={blockExplorer}
                            fontSize={16}
                          />
                          {/*<AddressInput
                            // ensProvider={mainnetProvider}
                            placeholder="transfer to address"
                            value={transferToAddresses[id]}
                            onChange={newValue => {
                              let update = {};
                              update[id] = newValue;
                              setTransferToAddresses({ ...transferToAddresses, ...update });
                            }}
                          />*/}
                        </div>
                        <div style={{ width: 500, height: "100%", margin: "auto", marginTop: 10, paddingBottom: 10 }}>
                          <Space>
                            <Button
                              type={"primary"}
                              onClick={() => {
                                console.log("writeContracts", writeContracts);
                                tx(writeContracts.YourCollectible.transferFrom(address, transferToAddresses[id], id));
                              }}
                            >
                              Transfer
                            </Button>
                          </Space>
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
              />

          <List
                header={<div>Transfer Events</div>}
                bordered
                dataSource={transferEvents}
                renderItem={item => {
                  return (
                    <List.Item key={item[0] + "_" + item[1] + "_" + item.blockNumber + "_" + item[2].toNumber()}>
                      <span style={{ fontSize: 16, marginRight: 8 }}>#{item[2].toNumber()}</span>
                      <Address
                        address={item[0]}
                        // ensProvider={mainnetProvider}
                        fontSize={16}
                      />{" "}
                      =>
                      <Address
                        address={item[1]}
                        // ensProvider={mainnetProvider}
                        fontSize={16}
                      />
                    </List.Item>
                  );
                }}
              />
        </Content>
        <Footer
          style={{ padding: 5, position: "fixed", zIndex: 1, width: "100%", bottom: 0 }}
          className="grad_glasswater"
        >
          <Row align="middle" gutter={[4, 4]}>
            <Col span={12}>
            </Col>

            <Col span={12} style={{ textAlign: "center" }}>
              <div style={{ opacity: 0.5 }}>
                {/*<a
                  target="_blank"
                  style={{ color: "#000" }}
                  href="https://github.com/austintgriffith/scaffold-eth"
                >
                  🍴 Repo: Fork me!
                </a>
                <br />*/}
                <a
                  target="_blank"
                  style={{ color: "#000" }}
                  href="https://github.com/harryranakl/scaffold-eth-strava-runners-nft"
                >
                  🍴 Repo: Fork me!
                </a>
              </div>
            </Col>
          </Row>
        </Footer>
      </Layout>
    </div>
  );
}

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

window.ethereum &&
  web3Modal.cachedProvider &&
  window.ethereum.on("chainChanged", chainId => {
    setTimeout(() => {
      window.location.reload();
    }, 1);
  });

window.ethereum &&
  window.ethereum.on("accountsChanged", accounts => {
    web3Modal.cachedProvider &&
      setTimeout(() => {
        window.location.reload();
      }, 1);
  });

export default App;
