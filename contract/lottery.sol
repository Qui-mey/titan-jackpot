pragma solidity 0.8.8;

// Import OpenZeppelin's ERC20 interface defenition
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CommunityLottery {
    IERC20 public token;

    address private owner;
    string public title;
    uint public endTime;
    uint public currentFunds;
    uint public numberOfEntries;

    struct Transaction {
        address _address;
        uint _amount;
        uint _timestamp;
    }

    mapping(address => Transaction[]) public transactions; 

    event InitLottery(string title, uint endTime, address indexed sender);
    event NewTransaction(address indexed sender, uint amount, uint timeStamp);
    event EndLottery(address indexed sender, uint amount);

    modifier onlyOwner {
        require(owner == msg.sender, "You are not the owner!");
        _;
    }

    constructor(IERC20 _token, address _owner) payable{
        token = _token;
        owner = _owner;
    }

    function InitializeLottery(string memory _title , uint _endTime) public onlyOwner {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_endTime > block.timestamp, "Endtime should be later than current time");

        title = _title;
        endTime = _endTime;
        currentFunds = 0;

        emit InitLottery(_title,_endTime, msg.sender);
    }

    function AddTransaction(uint _amount) public {
        bool sent = token.transferFrom(msg.sender, address(this), _amount);
        require(sent, "Token transfer failed");

        numberOfEntries++;
        currentFunds += _amount;

        Transaction memory transaction = Transaction(msg.sender, _amount, block.timestamp); 
        transactions[msg.sender].push(transaction);

        emit NewTransaction(msg.sender, _amount, block.timestamp);
    }

    function refund() public onlyOwner{
        uint _balance = token.balanceOf(address(this));
        bool sent =  token.transfer(msg.sender, _balance);
        require(sent, "Token transfer failed");

        currentFunds = 0;
        numberOfEntries = 0;

        emit EndLottery(msg.sender, _balance);
    }

    function DestroySmartContract() public onlyOwner{
        bool sent = token.transfer(msg.sender, token.balanceOf(address(this)));
        require(sent, "Token transfer failed");
        selfdestruct(payable(owner));
    }

    function SetOwner(address _owner) public  onlyOwner {
        owner = _owner;
    }
}


