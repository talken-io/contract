// transferOwnership - ZERO_ADDRESS로 transfer 가능

const {
    constants,
    expectRevert,
    expectEvent,
    time,
    balance,
    BN,
    ether
  } = require('@openzeppelin/test-helpers');
  const OwnableFactory = artifacts.require('OwnableMock');
  const init = new BN('1000000000').mul(new BN('10').pow(new BN('18')));
  var Ownable;
  
  contract('Ownable', accounts => {
    const [owner, recipient, spender, newOwner, ...others] = accounts;
  
    describe('#constructor()', () => {
      beforeEach(async () => {
        Ownable = await OwnableFactory.new({ from: owner });
      });
  
      it('should set owner to contract initializer', async () => {
        (await Ownable.owner()).should.be.equal(owner);
      });
    });
  
    describe('#owner()', () => {
      beforeEach(async () => {
        Ownable = await OwnableFactory.new({ from: owner });
      });
  
      it('should return appropriate owner', async () => {
        (await Ownable.owner()).should.be.equal(owner);
      });
    });
  
    describe('#renounceOwnership()', () => {
      beforeEach(async () => {
        Ownable = await OwnableFactory.new({ from: owner });
      });
      it('should fail if msg.sender is not owner', async () => {
        await expectRevert.unspecified(
          Ownable.renounceOwnership({ from: others[0] })
        );
      });
      describe('valid case', () => {
        var logs;
        beforeEach(async () => {
          const receipt = await Ownable.renounceOwnership({ from: owner });
          logs = receipt.logs;
        });
  
        it('should emit OwnershipTransferred event', async () => {
          expectEvent.inLogs(logs, 'OwnershipTransferred', {
            0: owner,
            1: constants.ZERO_ADDRESS
          });
        });
      });
    });
  
    describe('#transferOwnership()', () => {
      beforeEach(async () => {
        Ownable = await OwnableFactory.new({ from: owner });
      });
      it('should fail if msg.sender is not owner', async () => {
        await expectRevert.unspecified(
          Ownable.transferOwnership(newOwner, { from: others[0] })
        );
      });
  
      it('should fail if newOwner is ZERO_ADDRESS', async () => {
        await expectRevert.unspecified(
          Ownable.transferOwnership(constants.ZERO_ADDRESS, { from: owner })
        );
      });
  
      describe('valid case', () => {
        var logs;
        beforeEach(async () => {
          const receipt = await Ownable.transferOwnership(newOwner, {
            from: owner
          });
          logs = receipt.logs;
        });
  
        it('should emit OwnershipTransferred event', async () => {
          expectEvent.inLogs(logs, 'OwnershipTransferred', {
            0: owner,
            1: newOwner
          });
        });
        it('should set owner to newOwner', async () => {
          (await Ownable.owner()).should.be.equal(newOwner);
        });
      });
    });
  });