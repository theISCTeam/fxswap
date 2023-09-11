import './App.css';
import { Layout, Row, Col, FloatButton, Button, Card, Input } from "antd";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Provider, Network } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import {  SwapOutlined  } from "@ant-design/icons";

const provider = new Provider(Network.LOCAL);
const provider2 = new Provider(Network.MAINNET);
// change this to be your module account address
const coin_owner="0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f";
const liquidswap="0xee2610bcc5e690d166ce6c4b7a78c93afca1ebbe5ace4f89baf379fe79e513bb";
const COINS={
  "APT": 0,
  "ISC": 1,
  "USD": 2,
}

function App() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [balanceApt, setBalanceApt] = useState(0);
  const [balanceIsc, setBalanceIsc] = useState(0);
  const [balanceUsd, setBalanceUsd] = useState(0);
  const [inputAmount, setInputAmount] = useState(0);
  const [swapOrder, setSwapOrder] = useState([COINS.USD, COINS.ISC]);
  const [price, setPrice] = useState(0);

  const coinToString = (coin) => {
    switch (coin) {
      case COINS.APT:
        return "APT";
      case COINS.ISC:
        return "ISC";
      case COINS.USD:
        return "USD";
    }
  }

  const getResourceAddress = (coin) => {
    switch (coin) {
      case COINS.APT:
        return `0x1::aptos_coin::AptosCoin`;
      case COINS.ISC:
        return `${coin_owner}::isc_coin::IscCoin`;
      case COINS.USD:
        return `${coin_owner}::usd_coin::UsdCoin`;
    }
  }

  const fetchBalance = async (coin) => {
    if (!account) return [];
    try {
      let resource = `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`;
      switch (coin) {
        case COINS.APT:
          resource = `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`
        case COINS.ISC:
          resource = `0x1::coin::CoinStore<${coin_owner}::isc_coin::IscCoin>`
        case COINS.USD:
          resource = `0x1::coin::CoinStore<${coin_owner}::usd_coin::UsdCoin>`
      }
      const CoinStore = await provider.getAccountResource(
        account.address,
        resource
      );
      let balance = CoinStore.data.coin.value/1000000;
      if (coin==COINS.APT) setBalance(coin, balance/100);
      else setBalance(coin, balance);
    } catch (e) {
    }
  };

  const fetchPrice = async () => {
    if (!account) return [];
    try {
      let resource = `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`;
      const CoinStore = await provider.getAccountResource(
        account.address,
        resource
      );
      let balance = CoinStore.data.coin.value/1000000;
      if (coin==COINS.APT) setBalance(coin, balance/100);
      else setBalance(coin, balance);
    } catch (e) {
    }
  };

  useEffect(() => { fetchBalance(COINS.APT); }, [account?.address]);
  useEffect(() => { fetchBalance(COINS.ISC); }, [account?.address]);
  useEffect(() => { fetchBalance(COINS.USD); }, [account?.address]);
  useEffect(() => { fetchPrice(); }, [account?.address]);

  const setBalance = (coin, value) => {
    switch (coin) {
      case COINS.APT:
        setBalanceApt(value);
        break;
      case COINS.ISC:
        setBalanceIsc(value);
        break;
      case COINS.USD:
        setBalanceUsd(value);
        break;
    }
  }

  const updateAmount = async (e) => {
    setInputAmount(e.target.value);
  };

  const changeSwapOrder = async (e) => {
    setSwapOrder([swapOrder[1], swapOrder[0]])
  };

  const performSwap = async () => {
    if (!account) return [];
    // build a transaction payload to be submited
    const payload = {
      type: "entry_function_payload",
      function: `${liquidswap}::scripts::swap`,
      type_arguments: [
        getResourceAddress(swapOrder[0]),
        getResourceAddress(swapOrder[1]),
        `${liquidswap}::curves::Stable`,
      ],
      arguments: [parseInt(inputAmount)*1000000, 5],
    };
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(payload);
      // wait for transaction
      await provider.waitForTransaction(response.hash);
    } catch (error) {
    }
  };

  return (
    <div style= {{backgroundColor: '#000000', height: '1000000px'}}>
      <Layout>
        <Row align="middle" style={{backgroundColor: '#222222'}}>
          <Col span={10} offset={2}>
            <h1 style={{color: '#dddddd'}}>FxSwap</h1>
          </Col>
          <Col span={12} style={{ textAlign: "right", paddingRight: "100px" }}>
            <WalletSelector />
          </Col>
        </Row>
      </Layout>
      <Row gutter={[0, 32]} style={{ marginTop: "2rem"}}>
        <Col span={6} offset={10}>
          <Card title="Stable Swap">
            <Input suffix={coinToString(swapOrder[0])} onChange={updateAmount}/>
            <div style={{'display': 'flex', 'flexDirection': 'column',
                          'alignItems': 'center',
                          'textAlign:': 'center'
            }}>
              <Button shape="circle" size="small" icon={<SwapOutlined rotate="90" onClick={changeSwapOrder}/>} flex="center"/>
            </div>
            <Input suffix={coinToString(swapOrder[1])} />
            <br />
            <br />
            <Button onClick={performSwap} block type="primary" /*style={{ height: "40px", backgroundColor: "#3f67ff" }}*/>
              Swap
            </Button>

          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default App;
