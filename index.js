const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const moment = require("moment");
const { ethers, Wallet } = require("ethers");
var SHA256 = require("crypto-js/sha256");
const MD5 = require("crypto-js/md5");
const ordersModel = require("./models/orders.model");
const supporstModel = require("./models/support.model");

const {
  contract: { address, abi },
} = require("./const");
const app = express();
const http = require("http");
const server = http.createServer(app);

const adminAddress =
  process.env.ADMIN_WALLET_ADDRESS ||
  "0xd98027bC602C0fa9dA299216D80E04A2dD34a04e";

const rateConvert = process.env.RATE_CONVERT || 1;

const privateKey =
  process.env.PRIVATE_KEY ||
  "8f19eccf4479b464443296ec5dded6a5bf04e92a570a97858fc4e66b2019502e";

const provider =
  process.env.PROVIDER || "https://data-seed-prebsc-1-s1.binance.org:8545/";

const connectionString =
  process.env.CONNECTION_STRING ||
  "mongodb+srv://shopdi_bc_test:owoX67cnbx4uCe0q@shopditestbc.40ennkd.mongodb.net/?retryWrites=true&w=majority";

const PROCESS_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
};

const secretKey =
  process.env.SECRETKEY || "6LcfPlMiAAAAAFVQeCMZeXxLND37ABssYZryKrbL";

const API_URL_VOUCHER =
  process.env.API_VOUCHER ||
  "https://api-admin.shopdi.io/api/v1/bcvouchers/generator";

const port = process.env.PORT || 8000;
const privateKeyVoucher =
  process.env.PRIVATE_KEY_VOUCHER ||
  "MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAISjuQBXkuILZp3/lZjSijEt7LYtIehJ/ZzGcOwkjNbho/+BDuHROQ5oR02s6snMOK6RfaVlbU1zXKx9tRrQgj0gujyGcf3QyiI4TUZBX1aDBx+UAcKDxjVNzURC4SHax3LCDbSZykynTdtGDXO72IY0kl9uhaYunlyY47pe0rM/AgMBAAECgYB+Pnpx+ehCn8lO7pnLN/Dx+B0KFBDmz63EjxehmvQ1/dOi94pbolClBtl+8+sQoQD+Hloxl0UeZ4O4ZXl/iR+7elUMjzKtnI34rpu2eGQcGImB+NemZHDbFMGNKQDjvoVqj7K0kdFIqYVG6kIVUUq/ilFLPR9k3veewKBMUM9T6QJBAOLCzNqdQcNPYeo2OfWQ+6MjfSKyFRhOtsatuk2batB65zM2fHbiBaML/rcnHI+ofElXzmCNHkdUo77dvZvZSlUCQQCVvgyifThTxp00YFnCmKBjAxDJmYVnmHoAq8mxL3v38//VjpSDS9k6sam8N4y0Y65YJcXoxeHqrQmsFyFcgENDAkA0XiZvCkgoscl8DF/gPUZPy59XhubmQS9mvLI8v/qwAOIp6phd4B7LI7cEVyz6ZD+ntHZ9x7lJYdua9ZyXRFwtAkAqPzZdWarcp/qOXmi0qE8H4EOKPVAQDErPiagb32PAbwzM+a8Y4/tjveA/hASkmEMGB5IwvDOi/DLwZI47BMz1AkEAz6TFh53nJHZH6HCbIf+C99x+0GKh1Eb2SQ6H03jIeVLoKH889xE+1RoHZQT7ZFRVq+uaSQHGIt5D2Ho2yNX5tg==";
const publicKeyVoucher =
  process.env.PUBLICKEY_KEY_VOUCHER ||
  "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCEo7kAV5LiC2ad/5WY0ooxLey2LSHoSf2cxnDsJIzW4aP/gQ7h0TkOaEdNrOrJzDiukX2lZW1Nc1ysfbUa0II9ILo8hnH90MoiOE1GQV9WgwcflAHCg8Y1Tc1EQuEh2sdywg20mcpMp03bRg1zu9iGNJJfboWmLp5cmOO6XtKzPwIDAQAB";

const decimal = 1000000000000000000;

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const providerEther = new ethers.providers.JsonRpcProvider(provider);

const signer = new Wallet(privateKey);
const wallet = signer.connect(providerEther);
const shopdiContract = new ethers.Contract(address, abi, providerEther);
const withSigner = shopdiContract.connect(wallet);

async function createVoucher(params) {
  // console.log(params, API_URL_VOUCHER);
  return await axios.post(API_URL_VOUCHER, {
    ...params,
  });
}

const convertToCoin = (coinSHOD) => {
  return Number(coinSHOD);
};

async function paymentSuccess(orderPending) {
  const { SUCCESS } = PROCESS_STATUS;
  const { id, user, amount, value, emailorphone } = orderPending;

  try {
    const time = moment(new Date()).add(1, "years").format("DD/MM/YYYY");
    const stringConnect = `${privateKeyVoucher}$OrderCode=${id}&Amount=${convertToCoin(
      amount / decimal
    )}&Value=${value}&ExpiredDate=${time}&PhoneOrEmail=${emailorphone}`;

    const signature = SHA256(
      MD5(MD5(stringConnect).toString().toLocaleUpperCase())
        .toString()
        .toLocaleUpperCase()
    ).toString();

    const { status, data } = await createVoucher({
      data: {
        orderCode: id,
        amount: convertToCoin(amount / decimal),
        value,
        expiredDate: time,
        phoneOrEmail: emailorphone,
      },
      publicKey: publicKeyVoucher,
      signature,
    });
    if (status) {
      await ordersModel.findOneAndUpdate({ id }, { status: SUCCESS });
      return { data: data.data, status: true };
    } else {
      return { data: data.data, status: false };
    }
  } catch (err) {
    console.error(err);
  }
}

app.get("/adminWalletAddress", async (req, res) => {
  return res
    .status(200)
    .send({ success: true, data: { wallet: adminAddress, rate: rateConvert } });
});

app.post("/contact", async (req, res) => {
  const { phone, email, address, description } = req.body;
  if (!phone || !email || !address || !description) {
    return res.status(200).send({ success: false, message: "empty field" });
  }
  const model = new supporstModel({
    phone,
    email,
    address,
    description,
    status: PROCESS_STATUS.PENDING,
  });
  const result = await model.save();
  return res.status(200).send({ success: true, data: result });
});

app.post("/captcha", async (req, res) => {
  const { captcha } = req.body;

  if (!captcha) {
    res.json({ success: false, message: "captcha token is undefined" });
  }

  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}`;
  const body = await axios.post(url);
  const { data } = body;

  if (!data.success || data.score < 0.4) {
    console.log("data", data);
    return res.status(200).send({
      success: false,
      message: "You might be a robot, sorry!.",
      score: data.score,
    });
  }
  res.status(200).send({ success: true });
});

app.post("/order", async function (req, res) {
  const { user, amount, emailorphone, value, txt,captcha } = req.body;
  if (!user || !amount || !emailorphone || !value || !txt || !captcha) {
    return res.status(200).send({ success: false, message: "empty field" });
  }
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}`;
  const body = await axios.post(url);
  const { data } = body;
  if (!data.success || data.score < 0.4) {
    console.log("data", data);
    return res.status(200).send({
      success: false,
      message: "You might be a robot, sorry!.",
      score: data.score,
    });
  }
  try {
    const checkExits = await ordersModel.findOne({ id: txt });
    if (checkExits) {
      return res.status(200).send({
        success: false,
        message: "order has been created",
        data: txt,
      });
    }
    const orderModel = new ordersModel({
      user,
      amount,
      value,
      status: PROCESS_STATUS.PENDING,
      emailorphone,
      id: txt,
    });
    const pendingOrder = await orderModel.save();

    const transfer = await withSigner.transferFrom(user, adminAddress, amount);

    const data = await paymentSuccess(pendingOrder);
    if (data.status) {
      return res.status(200).send({ success: true, data: data?.data });
    } else {
      return res.status(200).send({
        success: false,
        message: "some thing wrong",
        data: txt,
        transaction:transfer.hash
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(200).send({
      success: false,
      message: "some thing wrong",
      data: txt,
    });
  }
});

mongoose
  .connect(connectionString)
  .then((result) => console.log("Database connection success"))
  .catch((err) => console.log("Database connect failed", err));

server.listen(port, function () {
  console.log("Server arealdy started", port);
});
