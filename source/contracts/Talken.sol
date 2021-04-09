pragma solidity 0.7.1;

import "./erc20/ERC20Lockable.sol";
import "./erc20/ERC20Burnable.sol";
import "./erc20/ERC20Mintable.sol";
import "./library/Pausable.sol";
import "./library/Freezable.sol";

contract Talken is
    ERC20Lockable,
    ERC20Burnable,
    ERC20Mintable,
    Freezable
{
    using SafeMath for uint256;
    string constant private _name = "Talken";
    string constant private _symbol = "TALK";
    uint8 constant private _decimals = 18;
    uint256 constant private _initial_supply = 0;

    constructor() Ownable() {
    }

    function mint(address receiver, uint256 amount)
        override
        external
        onlyOwner
        whenNotPaused
        returns (bool success)
    {
        require(
            receiver != address(0),
            "ERC20Mintable/mint : Should not mint to zero address"
        );
        require(
            !_mintingFinished,
            "ERC20Mintable/mint : Cannot mint after finished"
        );
        require(
            _totalSupply.add(amount) <= (500_000_000 * (10 ** uint256(18))),
            "ERC20Mintable/mint  : Cannot mint more than cap" 
        );
        _mint(receiver, amount);
        emit Mint(receiver, amount);
        success = true;
    }

    function transfer(address to, uint256 amount)
        override
        external
        whenNotFrozen(msg.sender)
        whenNotPaused
        checkLock(msg.sender, amount)
        returns (bool success) {
           require(
            to != address(0),
            "TALK/transfer : Should not send to zero address"
        );
        _transfer(msg.sender, to, amount);
        success = true;
    }

    function transferFrom(address from, address to, uint256 amount)
        override
        external
        whenNotFrozen(from)
        whenNotPaused
        checkLock(from, amount)
        returns (bool success)
    {
        require(
            to != address(0),
            "TALK/transferFrom : Should not send to zero address"
        );
        _transfer(from, to, amount);
        _approve(
            from,
            msg.sender,
            _allowances[from][msg.sender].sub(
                amount,
                "TALK/transferFrom : Cannot send more than allowance"
            )
        );
        success = true;
    }

    function approve(address spender, uint256 amount)
        override
        external
        returns (bool success)
    {
        require(
            spender != address(0),
            "SAM/approve : Should not approve zero address"
        );
        _approve(msg.sender, spender, amount);
        success = true;
    }

    function name() override external pure returns (string memory tokenName) {
        tokenName = _name;
    }

    function symbol() override external pure returns (string memory tokenSymbol) {
        tokenSymbol = _symbol;
    }

    function decimals() override external pure returns (uint8 tokenDecimals) {
        tokenDecimals = _decimals;
    }
}
