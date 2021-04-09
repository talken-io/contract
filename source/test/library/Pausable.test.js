const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

const PausableFactory = artifacts.require('Pausable');

contract('Pausable', accounts => {
  const [
    owner,
    newOwner,
    ...others
  ] = accounts;

  describe('#constructor()', ()=> {
    it('should success construct contract', async() => {
      Pausable = await PausableFactory.new({from: owner});
      (await Pausable.paused()).should.be.equal(false);
    });
  });

  describe('after initialization', () => {
    beforeEach(async() => {
      Pausable = await PausableFactory.new({from: owner});
    });

    describe('#pause()', () => {
      it('should fail when already paused', async () => {
        await Pausable.pause({from: owner});
        await expectRevert.unspecified(Pausable.pause({from: owner}));
      });

      it('should fail if msg.sender is not pauser', async() => {
        await expectRevert.unspecified(Pausable.pause({from: others[0]}));
      });

      it('should emit Paused event for valid case', async() => {
        const {logs} = await Pausable.pause({from: owner});
        expectEvent.inLogs(logs, 'Paused', {});
        (await Pausable.paused()).should.be.equal(true);
      });
    });

    describe('#unPause()', () => {
      it('should fail when already unpaused', async () => {
        await expectRevert.unspecified(Pausable.unPause({from: owner}));
      });

      it('should fail if msg.sender is not pauser', async() => {
        await Pausable.pause({from: owner});
        await expectRevert.unspecified(Pausable.unPause({from: others[0]}));
      });

      it('should emit Unpaused event for valid case', async() => {
        await Pausable.pause({from: owner});
        const {logs} = await Pausable.unPause({from: owner});
        expectEvent.inLogs(logs, 'Unpaused', {});
        (await Pausable.paused()).should.be.equal(false);
      });
    });
  });
});

function whenNotPaused(args) {
  it('should not work when paused', async function(){
    await this.contract.pause({from:this.owner});
    this.requireMessage = "Paused : This function can only be called when not paused";
  });
}

module.exports = {
  whenNotPaused
}
