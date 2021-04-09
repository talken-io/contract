const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

const FreezableFactory = artifacts.require('FreezableMock');
var Freezable;

contract('Pausable', accounts => {
  const [
    owner,
    freezed,
    ...others
  ] = accounts;

  beforeEach(async() => {
    Freezable = await FreezableFactory.new({from: owner});
  });

  describe('#freeze()', () => {
    it('should fail if msg.sender is not owner', async() => {
      await expectRevert(Freezable.freeze(freezed, {from: others[0]}), "Ownable : Function called by unauthorized user.");
    });

    describe('valid case', () => {
      let receipt;

      beforeEach(async() => {
        receipt = await Freezable.freeze(freezed, {from: owner});
      });

      it('target address freezed', async() => {
        await expectRevert(Freezable.whenNotFrozenMock(freezed), "Freezable : target is frozen");
        (await Freezable.isFrozen(freezed)).should.be.equal(true);
      });

      it('should emit Freeze event', () => {
        expectEvent(receipt, 'Freeze', {0: freezed});
      });
    });
  });

  describe('#unFreeze()', () => {
    it('should fail if msg.sender is not owner', async() => {
      await expectRevert(Freezable.unFreeze(freezed, {from: others[0]}), "Ownable : Function called by unauthorized user.");
    });

    describe('valid case', () => {
      let receipt;

      beforeEach(async() => {
        await Freezable.freeze(freezed, {from: owner});
        receipt = await Freezable.unFreeze(freezed, {from: owner});

      });

      it('target address unfreezed', async() => {
        await Freezable.whenNotFrozenMock(freezed);
      });

      it('should emit Unfreeze event', () => {
        expectEvent(receipt, 'Unfreeze', {0: freezed});
      });
    });
  });
});

function whenNotFrozen(args){
  it('should not work when frozen', async function(){
    await this.contract.freeze(args.user, {from:this.owner});
    this.requireMessage = "Freezable : target is frozen";
  });
}

module.exports = {
  whenNotFrozen
}
