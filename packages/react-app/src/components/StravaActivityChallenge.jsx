import React, { useState, useEffect } from "react";
import { Button, Space, Row, Col, Card, Steps, List } from "antd";
import axios from "axios";
import { useBalance, useEventListener, useContractReader, useLocalStorage, useSimpleLocalStorage } from "../hooks";
import { formatEther, parseEther } from "@ethersproject/units";
import Balance from "./Balance";
import Address from "./Address";

const { Step } = Steps;

const {
  REACT_APP_STRAVA_CLIENTID,
  REACT_APP_STRAVA_SECRET,
  REACT_APP_STRAVA_CALLBACK,
  REACT_APP_GOOGLE_APIKEY,
} = process.env;

const clientId = REACT_APP_STRAVA_CLIENTID;
const clientSecret = REACT_APP_STRAVA_SECRET;
const callback = REACT_APP_STRAVA_CALLBACK;
const googleApiKey = REACT_APP_GOOGLE_APIKEY;

const searchParams = new URLSearchParams(window.location.href);
let code = "",
  accessToken = "",
  refreshToken = "";
if (searchParams.has("code")) {
  code = searchParams.get("code");
}

export default function StravaActivityChallenge({ address, tx, provider, writeContracts, readContracts }) {
  // const [code, setCode] = useState();

  const [accessToken, setAccessToken] = useSimpleLocalStorage("accessToken");
  const [refreshToken, setRefreshToken] = useSimpleLocalStorage("refreshToken");

  const [stravaAthleteJson, setStravaAthleteJson] = useSimpleLocalStorage("stravaAthleteJson");
  const [stravaAthleteProfile, setStravaAthleteProfile] = useSimpleLocalStorage("stravaAthleteProfile");

  const AuthorizeUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${callback}&response_type=code&scope=activity:read`;
  const AccessTokenUrl = `https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${code}`;
  const RefreshTokenUrl = `https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`;

  useEffect(() => {
    checkAccessToken();
  }, []);

  useEffect(() => {}, []);

  const checkAccessToken = async () => {
    if (accessToken == null || refreshToken == null || code != "") {
      await axios
        .post(AccessTokenUrl)
        .then(response => {
          setAccessToken(response.data.access_token);
          setRefreshToken(response.data.refresh_token);

          setStravaAthleteJson(JSON.stringify(response.data.athlete));
          setStravaAthleteProfile(response.data.athlete.profile);

          // window.localStorage.setItem("accessToken", response.data.access_token);
          // window.localStorage.setItem("refreshToken", response.data.refresh_token);
          // window.localStorage.setItem("stravaAthlete", JSON.stringify(response.data.athlete));
          // window.localStorage.setItem("stravaAthleteProfile", response.data.athlete.profile);

          window.location.href = window.location.href.split("?")[0];
        })
        .catch(error => {
          console.log(error.response);
          setAccessToken(null);
          setRefreshToken(null);

          // window.localStorage.setItem("accessToken", "");
          // window.localStorage.setItem("refreshToken", "");
        });
    } else {
      await axios
        .post(RefreshTokenUrl)
        .then(response => {
          setAccessToken(response.data.access_token);
          setRefreshToken(response.data.refresh_token);

          // window.localStorage.setItem("accessToken", response.data.access_token);
          // window.localStorage.setItem("refreshToken", response.data.refresh_token);
        })
        .catch(error => {
          console.log(error.response);
          setAccessToken(null);
          setRefreshToken(null);

          // window.localStorage.setItem("accessToken", "");
          // window.localStorage.setItem("refreshToken", "");
        });
    }
  };

  // const mint = async () => {
  //   const _ipfsResult = await JSON.parse(window.localStorage.getItem("ipfsJson"));
  //   tx(writeContracts.YourCollectible.mintItem(_ipfsResult.path));
  // };

  const num = async (min, max) => {
    return Math.round(Math.random() * (max - min) + min);
  };

  const challenge = async () => {
    tx(
      writeContracts.YourChallenge.challenge(
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        num(1000, 2000),
        num(1000, 2000),
        1,
      ),
    );
  };

  const stake = async () => {
    tx(writeContracts.YourChallenge.stake(_challengesCount, { value: parseEther("1") }));
  };

  const startRun = async () => {
    tx(writeContracts.YourChallenge.startRun(_challengesCount));
  };

  const distance = async () => {
    tx(writeContracts.YourChallenge.updateDistance(_challengesCount, num(10, 20)));
  };

  const finish = async () => {
    tx(writeContracts.YourChallenge.finishRun(_challengesCount));
  };

  const winner = async () => {
    tx(writeContracts.YourChallenge.winnerRun(_challengesCount));
  };

  const reStart = async () => {
    // tx(writeContracts.YourChallenge.reStart() );
  };

  // const balance = useContractReader(
  //   readContracts,
  //   "YourChallenge",
  //   "balanceOf",
  //   [address],
  //   process.env.REACT_APP_POLLING,
  // );
  // console.log("🤗 balance:", balance);

  const YourChallengeBalance = useBalance(
    provider,
    readContracts && readContracts.YourChallenge.address,
    process.env.REACT_APP_POLLING,
  );
  const YourChallengeBalanceEth = YourChallengeBalance && formatEther(YourChallengeBalance);
  console.log("💵 YourChallenge Balance", YourChallengeBalanceEth);

  // let add1 = useContractReader(
  //   readContracts,
  //   "YourChallenge",
  //   "add1",
  //   [],
  //   process.env.REACT_APP_POLLING,
  // );
  // // add1= add1 && add1.toNumber();
  // console.log("🤗 add1:", add1);

  // let add2 = useContractReader(
  //   readContracts,
  //   "YourChallenge",
  //   "add2",
  //   [],
  //   process.env.REACT_APP_POLLING,
  // );
  // // add2= add2 && add2.toNumber();
  // console.log("🤗 add2:", add2);

  // let winnerAdd = useContractReader(
  //   readContracts,
  //   "YourChallenge",
  //   "winner",
  //   [],
  //   process.env.REACT_APP_POLLING,
  // );
  // // winnerAdd= winnerAdd && winnerAdd.toNumber();
  // console.log("🤗 winnerAdd:", winnerAdd);

  // let ath1 = useContractReader(
  //   readContracts,
  //   "YourChallenge",
  //   "ath1",
  //   [],
  //   process.env.REACT_APP_POLLING,
  // );
  // ath1= ath1 && ath1.toNumber();
  // console.log("🤗 ath1:", ath1);

  // let ath2 = useContractReader(
  //   readContracts,
  //   "YourChallenge",
  //   "ath2",
  //   [],
  //   process.env.REACT_APP_POLLING,
  // );
  // ath2= ath2 && ath2.toNumber();
  // console.log("🤗 ath2:", ath2);

  // let dist1 = useContractReader(
  //   readContracts,
  //   "YourChallenge",
  //   "dist1",
  //   [],
  //   process.env.REACT_APP_POLLING,
  // );
  // dist1= dist1 && dist1.toNumber();
  // console.log("🤗 dist1:", dist1);

  // let dist2 = useContractReader(
  //   readContracts,
  //   "YourChallenge",
  //   "dist2",
  //   [],
  //   process.env.REACT_APP_POLLING,
  // );
  // dist2= dist2 && dist2.toNumber();
  // console.log("🤗 dist2:", dist2);

  // let start = useContractReader(
  //   readContracts,
  //   "YourChallenge",
  //   "start",
  //   [],
  //   process.env.REACT_APP_POLLING,
  // );
  // console.log("🤗 start:", start);

  // let completed = useContractReader(
  //   readContracts,
  //   "YourChallenge",
  //   "completed",
  //   [],
  //   process.env.REACT_APP_POLLING,
  // );
  // console.log("🤗 completed:", completed);

  let _challengesCount = useContractReader(
    readContracts,
    "YourChallenge",
    "_challengesCount",
    [],
    process.env.REACT_APP_POLLING,
  );
  _challengesCount = _challengesCount && _challengesCount.toNumber();
  console.log("🤗 _challengesCount:", _challengesCount);

  let timeLeft = useContractReader(
    readContracts,
    "YourChallenge",
    "timeLeft",
    [_challengesCount],
    process.env.REACT_APP_POLLING,
  );
  timeLeft = timeLeft && Math.floor(timeLeft.toNumber() / 100);
  console.log("🤗 timeLeft:", timeLeft);

  let _challengesMap = useContractReader(
    readContracts,
    "YourChallenge",
    "_challengesMap",
    [_challengesCount],
    process.env.REACT_APP_POLLING,
  );
  // _challengesMap = _challengesMap && _challengesMap.toNumber();
  console.log("🤗 _challengesMap:", _challengesMap);
  let balances, add1, add2, winnerAdd, ath1, ath2, dist1, dist2, mins, deadline, start, completed, end;
  if (_challengesMap) {
    balances = _challengesMap.balances && formatEther(_challengesMap.balances);
    add1 = _challengesMap.add1;
    add2 = _challengesMap.add2;
    winnerAdd = _challengesMap.winner;
    ath1 = _challengesMap.ath1.toNumber();
    ath2 = _challengesMap.ath2.toNumber();
    dist1 = _challengesMap.dist1.toNumber();
    dist2 = _challengesMap.dist2.toNumber();
    mins = _challengesMap.mins.toNumber();
    deadline = _challengesMap.deadline.toNumber();
    start = _challengesMap.start;
    completed = _challengesMap.completed;
    end = _challengesMap.end;
  }

  //📟 Listen for broadcast events
  const challengeEvents = useEventListener(readContracts, "YourChallenge", "Challenge", provider, 1);
  console.log("📟 challenge events:", challengeEvents);

  const stakeEvents = useEventListener(readContracts, "YourChallenge", "Stake", provider, 1);
  console.log("📟 Stake events:", stakeEvents);

  const WinnerRunEvents = useEventListener(readContracts, "YourChallenge", "WinnerRun", provider, 1);
  console.log("📟 WinnerRun events:", WinnerRunEvents);

  return (
    <div style={{ margin: "auto", marginTop: 10, padding: 10 }}>
      <div style={{ margin: "auto", marginTop: 10 }}>
        <Steps size="small" direction="vertical">
          <Step title="Network" description="please connect to kovan testnet." status={"process"} />
          <Step title="Authorize" description="(optional) please connect to Strava" status={"process"} />
          <Step title="Challenge Friend" description="create new Challenge and invite your Friend" status={"process"} />
          <Step title="Stake Eth" description="stake some eth ($0-$5)" status={"process"} />
          <Step title="Defi Staking" description="choose Staking: uniswap, compound, aave etc" status={"process"} />
          <Step title="Complete" description="record your Run/Ride on Strava" status={"process"} />
          <Step title="ChainLink Oracle" description="" status={"process"} />
          <Step title="Winner" description="Winner get the staking" status={"process"} />
          <Step title="Mint NFT" description="(optional) mint the nft on kovan testnet" status={"process"} />
        </Steps>
      </div>
      <Space>
        <Button
          type={"primary"}
          onClick={() => {
            window.open(AuthorizeUrl);
          }}
        >
          Authorize Strava App
        </Button>
      </Space>

      {/*<h2>code - {window.localStorage.getItem("code")}</h2>*/}
      <h2>accessToken - {window.localStorage.getItem("accessToken")}</h2>
      <h2>refreshToken - {window.localStorage.getItem("refreshToken")}</h2>
      <h3>challenges id - {_challengesCount}</h3>
      <h3>total balance - {YourChallengeBalanceEth}</h3>
      <h3>balance - {balances}</h3>
      <h3>add1 - {add1 && add1}</h3>
      <h3>add2 - {add2 && add2}</h3>
      <h3>winner - {winnerAdd && winnerAdd}</h3>
      <h3>ath1 - {ath1 && ath1}</h3>
      <h3>ath2 - {ath2 && ath2}</h3>
      <h3>dist1 - {dist1 && dist1}</h3>
      <h3>dist2 - {dist2 && dist2}</h3>
      <h3>start - {start && start ? "true" : "false"}</h3>
      <h3>completed - {completed && completed ? "true" : "false"}</h3>
      <h3>end - {end && end ? "true" : "false"}</h3>
      <h3>timeLeft - {timeLeft && timeLeft}</h3>
      <Card
        title="Invite Friends to play Run/Ride Activities"
        style={{ margin: "auto", marginTop: 10, paddingBottom: 10 }}
      >
        <Space wrap>
          <Button
            type={"primary"}
            onClick={() => {
              challenge();
            }}
          >
            challenge
          </Button>
          <Button
            type={"primary"}
            onClick={() => {
              stake();
            }}
          >
            stake
          </Button>
          <Button
            type={"primary"}
            onClick={() => {
              startRun();
            }}
          >
            start
          </Button>
          <Button
            type={"primary"}
            onClick={() => {
              distance();
            }}
          >
            distance
          </Button>
          <Button
            type={"primary"}
            onClick={() => {
              finish();
            }}
          >
            finish
          </Button>
          <Button
            type={"primary"}
            onClick={() => {
              winner();
            }}
          >
            winner
          </Button>
          <Button
            type={"primary"}
            onClick={() => {
              // reStart();
            }}
          >
            reStart
          </Button>
        </Space>
      </Card>
      <List
        header={<div>Challenge Events</div>}
        bordered
        dataSource={challengeEvents}
        renderItem={item => {
          return (
            <List.Item key={item[0] + "_" + item[1] + "_" + item.blockNumber + "_" + item[2].toNumber()}>
              <span style={{ fontSize: 16, marginRight: 8 }}>#{item[5].toNumber()}</span>
              <Address
                address={item[0]}
                // ensProvider={mainnetProvider}
                fontSize={16}
              />{" "}
              -
              <Address
                address={item[1]}
                // ensProvider={mainnetProvider}
                fontSize={16}
              />
              <br />
              Athlete1 - {item[2].toNumber()} - Athlete2 - {item[3].toNumber()} - {item[4].toNumber()} Minutes }
            </List.Item>
          );
        }}
      />
      <List
        header={<div>Winner Events</div>}
        bordered
        dataSource={WinnerRunEvents}
        renderItem={item => {
          return (
            <List.Item key={item[0] + "_" + item[1] + "_" + item.blockNumber}>
              <span style={{ fontSize: 16, marginRight: 8 }}>#{item[0].toNumber()}</span>
              <Address
                address={item[1]}
                // ensProvider={mainnetProvider}
                fontSize={16}
              />{" "}
            </List.Item>
          );
        }}
      />
      <List
        header={<div>Stake Events</div>}
        bordered
        dataSource={stakeEvents}
        renderItem={item => {
          return (
            <List.Item key={item[0] + "_" + item[1] + "_" + item.blockNumber}>
              <span style={{ fontSize: 16, marginRight: 8 }}>#{item[0].toNumber()}</span>
              <Address
                address={item[1]}
                // ensProvider={mainnetProvider}
                fontSize={16}
              />{" "}
              - <Balance balance={item[2]} />
            </List.Item>
          );
        }}
      />
    </div>
  );
}
