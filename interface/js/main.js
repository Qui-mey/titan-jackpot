const config = {
    css: {
        ids: {

        },
        classes: {

        }
    },
    application: {
        serviceApi: "https://pcinic-api.glitch.me",
        // serviceApi: "https://alpaca-faucet.herokuapp.com",
        accountServiceApi: "https://ipfs.3box.io",



        contractAddressToken: "0xc571a04f4332093364ce38559f313ba2a766fbb9",
        contractAddressLottery: "0x0Fa233a3b77b881DAC279FE7465fdaF74a88b943",

        contractAbiToken: "./common/tokenABI.json",
        contractAbiLottery:"./common/lotteryABI.json"
    },
    messages: {
        faucet_error: "We could not reach the API 😪",
        faucet_fetching: "Processing...",
        faucet_unconnected: "No wallet is connected 😔",

        web3_unconnected: "Connect MetaMask",
        web3_connected: "",
        web3_no_support: "You have to install MetaMask!"
    }
}

var web3 = new Web3();


window.addEventListener("load", async function () {

    init();
    // Stup And Check for Web3 Compatibility
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        EnableEthereum();
    }
    else {
        // alert(config.messages.web3_no_support);
        SetContractInfo();
    }
    InsertTransactions()
});

async function init() {
    
}


// ETH Test API (pcinic-api.glitch.me)
// fortunately it is no longer a opaque request
async function GetFaucetEth() {
    let _statusElement = document.getElementById("status");
    _statusElement.innerText = config.messages.faucet_fetching;

    await web3.eth.getAccounts(async function (err, accounts) {
        if (accounts[0]) {
            await fetch(`${config.application.serviceApi}/request/${accounts[0]}`)
                .then(async function (resp) {
                    _statusElement.innerText = await resp.json().then(m => m.message);
                }).catch(err => {
                    console.log(`error: ${err}`);
                    _statusElement.innerText = config.messages.faucet_error;
                });
        } else {
            _statusElement.innerText = config.messages.faucet_unconnected;
        }
    });
}

async function SetConnectionStatus(address = null) {
    let element = document.getElementById("connection-text");
    let statusBadge = document.getElementById("connection-status");
    if (!address) {
        element.innerText = config.messages.faucet_unconnected;

    } else {
        element.innerText = address.formatAddress(6, 38);
        statusBadge.classList.add("connected");
        element.title = address;

        let tokenAbi = await fetch(config.application.contractAbiToken).then(function(res){return res.json()});
        console.log(tokenAbi);
        let lotteryAbi = await fetch(config.application.contractAbiLottery).then(function(res){return res.json()});
        console.log(lotteryAbi);

        let contractInstance = new web3.eth.Contract(
            tokenAbi,
            config.application.contractAddressToken
        );
        console.log("token_name:", await contractInstance.methods.name().call());
        console.log("local_ballance:", web3.utils.fromWei(await (contractInstance.methods.balanceOf(address).call())));
        console.log("contract_allowance:", await contractInstance.methods.allowance(address, config.application.contractAddressLottery).call());
        //console.log(await contractInstance.methods.approve(config.application.contractAddressLottery, 1e18).send({from:address}));


        let lotteryContract = new web3.eth.Contract(
            lotteryAbi,
            config.application.contractAddressLottery
        );

        lotteryContract.events
            .allEvents(
                {
                    fromBlock: 0
                },
                function (error, event) {
                    console.log(event);
                }
            )
            .on("connected", function (subscriptionId) {
                console.log("sunscription:", subscriptionId);
            })
            .on("data", function (event) {
                console.log(event);
            }).on("InitLottery", function (event) {
                console.log(event);
            })
            .on("changed", function (event) { })
            .on("error", function (error, receipt) { });


            lotteryContract.getPastEvents('NewTransaction', {
                fromBlock: 0,
                toBlock: 'latest'
            }, function(error, events){ console.log(events); })
            .then(function(events){
                console.log(events) // same results as the optional callback above
            });

        let lottery_title = await lotteryContract.methods.title().call();
        let lottery_funds = await lotteryContract.methods.currentFunds().call();
        let lottery_end_time = await lotteryContract.methods.endTime().call();

        console.log("lottery_title:", lottery_title);
        console.log("lottery_end_time:", lottery_end_time);
        console.log("lottery_funds:", lottery_funds);
        console.log("lottery_num_entries:", await lotteryContract.methods.numberOfEntries().call());

        document.querySelector(".info-panel>.title").innerHTML = lottery_title;
        document.querySelector(".info-panel>.amount").innerHTML = web3.utils.fromWei(lottery_funds);
        await ActivateCountdownTimer(lottery_end_time);
        document.querySelector(".info-panel").classList.remove("skeleton");
    }
}

// Enables Metamask to make a conncetion with web3
async function EnableEthereum() {
    web3.eth.getAccounts(async function (err, accounts) {
        if (accounts.length > 0) {
            // document.getElementById("address").value = accounts[0];
            SetConnectionStatus(accounts[0]);
            // 3box test
            console.log(await Get3boxAccountFromAdress(accounts[0]));
        } else {

            window.ethereum.enable().then(async function () {
                // User has allowed account access to DApp...
                console.log("Dapp Allowed");
                let accounts = await web3.eth.getAccounts();
                SetConnectionStatus(accounts[0]);
                // document.getElementById("address").value = accounts[0];
            }).catch(function (e) {
                console.log("Dapp Disalloweddddddddddd");
                SetConnectionStatus();
            });
        }
    });
}

async function InsertTransactions() {
    let result = await GetLotteryTransactions();

    document.getElementById("transaction-placeholder").remove();
    result.result.forEach(function (transaction) {
        if (transaction.to.toLocaleLowerCase() === config.application.contractAddressLottery.toLocaleLowerCase()) {
            let html = ` <li class="transaction">
            <a href="https://rinkeby.etherscan.io/tx/${transaction.hash}" rel="noopener" target="_blank">
                <div class="address">${transaction.from.formatAddress(20, 45)}</div>
            </a>
            <div class="amount">+${web3.utils.fromWei(transaction.value)}</div>
            <div class="timestamp">${GetTimeFormattedString(parseInt(transaction.timeStamp))}</div>
        </li>`;
            document.getElementById("transaction-list").insertAdjacentHTML("afterbegin", html);
        }
    });
}

async function SetContractInfo() {
    let result = await fetch(`${config.application.serviceApi}/contract`)
        .then(function (res) {
            return res.json();
        })
        .catch(function (err) {
            console.log(`error: ${err}`);
        });

    console.log(result)
    document.querySelector(".info-panel>.title").innerHTML = result.lottery_title;
    document.querySelector(".info-panel>.amount").innerHTML = web3.utils.fromWei(result.lottery_funds);
    await ActivateCountdownTimer(result.lottery_end_time);
    document.querySelector(".info-panel").classList.remove("skeleton");
}

async function ActivateCountdownTimer(timestamp) {
    let pad = (n, s = 2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
    function _calculateString() {
        let now = new Date().getTime();
        let difference = (timestamp * 1000) - now;

        let days = Math.floor(difference / (1000 * 60 * 60 * 24));
        let hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((difference % (1000 * 60)) / 1000);

        document.querySelector(".info-panel>.timer").innerHTML = `${days} days ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

        if (difference < 0) {
            clearInterval(x);
            document.querySelector(".info-panel>.timer").innerHTML = "Awaiting draw...";
        }
    }
    let x = setInterval(_calculateString, 1000);
    _calculateString();
}

async function Get3boxAccountFromAdress(address) {
    return await fetch(`${config.application.accountServiceApi}/profile?address=${address}`)
        .then(function (res) {
            return res.json();
        }).catch(function (err) {
            console.log(`error: ${err}`);
        });
}

async function GetLotteryTransactions() {
    return await fetch(`${config.application.serviceApi}/transactions`).then(async function (res) {
        return res.json();
    }).catch(err => {
        console.log(`error: ${err}`);
    });
}

function GetTimeFormattedString(timestamp) {
    let pad = (n, s = 2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
    let d = new Date(timestamp * 1000);
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

String.prototype.formatAddress = function (i0, i1) {
    return this.substring(0, i0) + `...` + this.substring(i1);
}

document.querySelector(".mascot-icon").addEventListener("click", function (e) {
    let element = document.querySelector(".mascot");
    let booster = document.querySelector(".booster");
    booster.classList.add("active");
    element.classList.add("active");
    setTimeout(function () {
        element.remove();
        booster.remove();
    }, 2000);
});

