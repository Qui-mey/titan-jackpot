// Website response messages
const Messages = {
    faucet_error: "We could not reach the API 😪",
    faucet_fetching: "Processing...",
    faucet_unconnected: "No wallet is connected 😔",
    unconnected_web3: "Connect MetaMask",
    connected_web3: "",
    no_support_web3: "You have to install MetaMask !"
}

// Temp settings
const Settings = {
    //service_provider: "https://pcinic-api.glitch.me", //TEST ENDPOINT ONLY
    service_provider: "https://alpaca-faucet.herokuapp.com",
    account_provider: "https://ipfs.3box.io",

    token_contract: "0xc571a04f4332093364ce38559f313ba2a766fbb9",
    lottery_contract: "0x870c9FA818A2F3825026859618177C21679331a7"
}

var web3 = new Web3();

window.addEventListener("load", function () {
    // Stup And Check for Web3 Compatibility
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        EnableEthereum();
    }
    // Legacy DApp Browsers
    else if (window.web3) {
        web3 = new Web3(web3.currentProvider);
    }
    // Non-DApp Browsers
    else {
        alert(Messages.no_support_web3);
    }

    InsertTransactions()
});

// ETH Test API (pcinic-api.glitch.me)
// fortunately it is no longer a opaque request
async function GetFaucetEth() {
    let _statusElement = document.getElementById("status");
    _statusElement.innerText = Messages.faucet_fetching;

    await web3.eth.getAccounts(async function (err, accounts) {
        if (accounts[0]) {
            await fetch(`${Settings.service_provider}/request/${accounts[0]}`)
                .then(async function (resp) {
                    _statusElement.innerText = await resp.json().then(m => m.message);
                }).catch(err => {
                    console.log(`error: ${err}`);
                    _statusElement.innerText = Messages.faucet_error;
                });
        } else {
            _statusElement.innerText = Messages.faucet_unconnected;
        }
    });
}

async function SetConnectionStatus(address = null) {
    let element = document.getElementById("connection-indicator");
    if (!address) {
        element.innerHTML = `<status></status>` + Messages.unconnected_web3;
        let result = await GetLotteryTransactions();
        console.log(result);

        document.getElementById("transaction-placeholder").remove();
        result.result.reverse().forEach(function (transaction) {
            if (transaction.to.toLocaleLowerCase() === Settings.lottery_contract.toLocaleLowerCase()) {
                let html = ` <li class="transaction">
                <a href="https://rinkeby.etherscan.io/tx/${transaction.hash}" target="_blank">
                    <div class="address">${transaction.from.formatAddress(20, 45)}</div>
                </a>
                <div class="amount">+${web3.utils.fromWei(transaction.value)}</div>
                <div class="timestamp">${GetTimeFormattedString(parseInt(transaction.timeStamp))}</div>
            </li>`;
                document.getElementById("transaction-list").insertAdjacentHTML("beforeend", html);
            }
        });
    } else {
        element.innerHTML = `<status class="connected"></status>` + address.formatAddress(6, 38);
        element.title = address;

        let contractInstance = new web3.eth.Contract(
            Token_abi,
            Settings.token_contract
        );
        console.log(await contractInstance.methods.name().call());
        console.log(web3.utils.fromWei(await (contractInstance.methods.balanceOf(address).call())));
        console.log(await contractInstance.methods.allowance(address, Settings.lottery_contract).call());
        //console.log(await contractInstance.methods.approve(Settings.lottery_contract, 100e18).send({from:address}));
        

        let lotteryContract = new web3.eth.Contract(
            Spender_abi,
            Settings.lottery_contract
        );

        console.log(await lotteryContract.methods.title().call());
        console.log(await lotteryContract.methods.endTime().call());
        console.log(await lotteryContract.methods.currentFunds().call());
        console.log(await lotteryContract.methods.numberOfEntries().call());
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
    console.log(result);

    document.getElementById("transaction-placeholder").remove();
    result.result.reverse().forEach(function (transaction) {
        if (transaction.to.toLocaleLowerCase() === Settings.lottery_contract.toLocaleLowerCase()) {
            let html = ` <li class="transaction">
            <a href="https://rinkeby.etherscan.io/tx/${transaction.hash}" target="_blank">
                <div class="address">${transaction.from.formatAddress(20, 45)}</div>
            </a>
            <div class="amount">+${web3.utils.fromWei(transaction.value)}</div>
            <div class="timestamp">${GetTimeFormattedString(parseInt(transaction.timeStamp))}</div>
        </li>`;
            document.getElementById("transaction-list").insertAdjacentHTML("beforeend", html);
        }
    });
}

async function Get3boxAccountFromAdress(address) {
    return await fetch(`${Settings.account_provider}/profile?address=${address}`)
        .then(async function (res) {
            return res.json();
        }).catch(err => {
            console.log(`error: ${err}`);
        });
}

async function GetLotteryTransactions() {
    return await fetch(`${Settings.service_provider}/transactions`).then(async function (res) {
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


let Token_abi = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "subtractedValue",
                "type": "uint256"
            }
        ],
        "name": "decreaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "addedValue",
                "type": "uint256"
            }
        ],
        "name": "increaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

let Spender_abi = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "AddTransaction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "DestroySmartContract",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_title",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_endTime",
                "type": "uint256"
            }
        ],
        "name": "InitializeLottery",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "refund",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "SetOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "contract IERC20",
                "name": "_token",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_owner",
                "type": "address"
            }
        ],
        "stateMutability": "payable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "currentFunds",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "endTime",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "numberOfEntries",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "title",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "token",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "transactions",
        "outputs": [
            {
                "internalType": "address",
                "name": "_address",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_timestamp",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]