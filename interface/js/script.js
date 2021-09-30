// Website response messages
const Messages = {
    faucet_error: "We could not reach the API 😪",
    unconnected_web3: "Connect MetaMask",
    connected_web3: "",
    no_support_web3: "You have to install MetaMask !"
}

// Temp settings
const Settings = {
    eth_provider: "https://pcinic-api.glitch.me",
    account_provider: "https://ipfs.3box.io"
}

// Stup And Check for Web3 Compatibility
var web3 = new Web3();
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
    alert('You have to install MetaMask !');
    document.getElementById("web3-connection").innerText = Messages.no_support_web3;
}

// ETH Test API (pcinic-api.glitch.me)
// fortunately it is no longer a opaque request
async function GetEth() {
    document.getElementById("status").innerText = "Processing...";
    let address = document.getElementById("address").value;
    let res = await fetch(`${Settings.eth_provider}/request/${address}`)
        .then(async function (resp) {
            resp.message = await resp.json().then(m => m.message);
            return resp;
        }).catch(err => {
            console.log(`error: ${err}`);
        });
    document.getElementById("status").innerText = res ? res.message : Messages.faucet_error;
}

// Enables Metamask to make a conncetion with web3
async function EnableEthereum() {

    function SetConnectionStatus(address = null) {
        let element = document.getElementById("connection-indicator");
        if (!address) {
            element.innerHTML = `<status></status>` + Messages.unconnected_web3;
        } else {
            element.innerHTML = `<status class="connected"></status>` + address.formatAddress(6, 38);
        }
    }

    web3.eth.getAccounts(async function (err, accounts) {
        if (accounts.length > 0) {
            document.getElementById("address").value = accounts[0];
            SetConnectionStatus(accounts[0]);
            // 3box test
            console.log(await Get3boxAccountFromAdress(accounts[0]));
        } else {
            try {
                window.ethereum.enable().then(async function () {
                    // User has allowed account access to DApp...
                    console.log("Dapp Allowed");
                    let accounts = await web3.eth.getAccounts();
                    SetConnectionStatus(accounts[0]);
                    document.getElementById("address").value = accounts[0];
                });
            } catch (e) {
                // User has denied account access to DApp...
                console.log("Dapp Disallowed");
                SetConnectionStatus();
                document.getElementById("web3-connection").innerText = Messages.unconnected_web3;
            }
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

String.prototype.formatAddress = function (i0, i1) {
    return this.substring(0, i0) + `...` + this.substring(i1);
}