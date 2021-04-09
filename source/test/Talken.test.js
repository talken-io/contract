const { constants, expectEvent, expectRevert, BN, ether, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const web3 = require('web3');

const tokenFactory = artifacts.require('Talken');

const ERC20 = require('./erc20/ERC20.behavior');
const ERC20Lockable = require('./erc20/ERC20Lockable.behavior');
const ERC20Mintable = require('./erc20/ERC20Mintable.behavior');
const ERC20Burnable = require('./erc20/ERC20Burnable.behavior');

const Pausable = require('./library/Pausable.test');
const Freezable = require('./library/Freezable.test');
require('chai').should();

contract('SampleToken', function(account)  {
  const name = 'Talken';
  const symbol = 'TALK';
  const decimals = new BN('18');
  const INITIAL_SUPPLY = new BN('0');
  const CAPPED = (new BN('500000000')).mul(ether('1'));
  const [owner, sender, recipient, spender, ...others] = account;
  const amount = new BN('100');

  beforeEach(async function()  {
    this.token = await tokenFactory.new({ from: owner });
    this.contract = this.token;
    this.owner = owner;
  });

  ERC20.constructor(name,symbol,decimals,INITIAL_SUPPLY,owner);

  describe('ERC20 Spec', function() {
    beforeEach(async function() {
      await this.token.mint(owner, CAPPED, {from : owner});
      await this.token.transfer(sender, amount, {from:owner});
    });

    ERC20.transfer(sender, recipient, amount, [Freezable.whenNotFrozen, Pausable.whenNotPaused, ERC20Lockable.checkLock]);

    ERC20.transferFrom(sender, recipient, spender, amount, [Freezable.whenNotFrozen, Pausable.whenNotPaused, ERC20Lockable.checkLock]);

    ERC20.approve(sender, spender, amount);
  });

  describe('ERC20Lockable Spec', function(){
    beforeEach(async function() {
      await this.token.mint(owner, CAPPED, {from : owner});
      await this.token.transfer(sender, amount, {from:owner});
    });

    ERC20Lockable.transferWithLockUp(owner, recipient, amount);

    ERC20Lockable.unlock(owner, recipient, amount);

    ERC20Lockable.releaseLock(owner, others[0], recipient, amount);
  });

  describe('ERC20Mintable Spec', function(){
    ERC20Mintable.mint(owner, others[0], recipient, amount);

    ERC20Mintable.finishMint(owner, others[0]);
  });

  describe('ERC20Burnable Spec', function(){
    beforeEach(async function() {
      await this.token.mint(owner, CAPPED, {from : owner});
      await this.token.transfer(sender, amount, {from:owner});
    });

    ERC20Burnable.burn(owner, amount, [Pausable.whenNotPaused]);

    ERC20Burnable.burnFrom(owner, spender, amount, [Pausable.whenNotPaused]);
  });
});
