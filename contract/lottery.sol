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
    }
    
	function AddTransaction(uint _amount) public {
		bool sent = token.transferFrom(msg.sender, address(this), _amount);
        require(sent, "Token transfer failed");
		numberOfEntries++;
		currentFunds += _amount;
		Transaction memory transaction = Transaction(msg.sender, 2, block.timestamp); 
		transactions[msg.sender].push(transaction);
	}
	
    function refund() public onlyOwner{
        bool sent =  token.transfer(msg.sender, token.balanceOf(address(this)));
        require(sent, "Token transfer failed");
        currentFunds = 0;
        numberOfEntries = 0;
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


