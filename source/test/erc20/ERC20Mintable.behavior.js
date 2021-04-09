const { constants, expectEvent, expectRevert, BN, ether, time } = require('@openzeppelin/test-helpers');
function mint(owner, nonOwner, recipient, amount){
  describe('#mint()', function()  {
    it('should fail if msg.sender is not owner', async function()  {
      await expectRevert(
        this.token.mint(recipient, amount, { from: nonOwner }),
        'Ownable : Function called by unauthorized user.',
      );
    });

    it('should fail when paused', async function()  {
      await this.token.pause({ from: owner });
      await expectRevert.unspecified(this.token.mint(recipient, amount, { from: owner }));
    });

    it('should fail if overflows', async function()  {
      await expectRevert.unspecified(this.token.mint(recipient, constants.MAX_UINT256, { from: owner }));
    });

    it('should fail if try to mint to ZERO_ADDRESS', async function()  {
      await expectRevert.unspecified(
        this.token.mint(constants.ZERO_ADDRESS, amount, { from: owner }),
        'ERC20Mintable/mint : Should not mint to zero address',
      );
    });

    it('should fail if mint is finished', async function(){
      await this.token.finishMint();
      await expectRevert(this.token.mint(recipient, amount, {from:owner}),  "ERC20Mintable/mint : Cannot mint after finished");
    });

    it('should fail if try to mint more than cap', async function() {
      await expectRevert(this.token.mint(recipient, amount.mul(ether('1000000000'))), "ERC20Mintable/mint  : Cannot mint more than cap");
    });

    describe('valid case', async function()  {
      let receipt;
      let beforeReceiverBalance, beforeTotalSupply;
      let afterReceiverBalance, afterTotalSupply;

      beforeEach(async function()  {
        beforeReceiverBalance = await this.token.balanceOf(recipient);
        beforeTotalSupply = await this.token.totalSupply();
        receipt = await this.token.mint(recipient, amount, { from: owner }); afterReceiverBalance = await this.token.balanceOf(recipient);
        afterTotalSupply = await this.token.totalSupply();
      });

      it("receiver's amount should increase", async function()  {
        afterReceiverBalance.should.be.bignumber.equal(beforeReceiverBalance.add(amount));
      });

      it('totalSupply should increase', async function()  {
        afterTotalSupply.should.be.bignumber.equal(beforeTotalSupply.add(amount));
      });

      it('should emit Transfer event', function()  {
        expectEvent(receipt, 'Transfer', {
          0: constants.ZERO_ADDRESS,
          1: recipient,
          2: amount,
        });
      });

      it('should emit Mint event', function()  {
        expectEvent(receipt, 'Mint', {
          0: recipient,
          1: amount,
        });
      });
    });
  });
}

function finishMint(owner, nonOwner){
  describe('#finishMint()', function(){
    it('should fail if msg.sender is not owner', async function(){
      await expectRevert(this.token.finishMint({from: nonOwner}), "Ownable : Function called by unauthorized user.");
    });

    it('should fail if already finished', async function(){
      await this.token.finishMint({from:owner});
      await expectRevert(this.token.finishMint({from:owner}), "ERC20Mintable/finishMinting : Already finished");
    });

    it('should set _mintingFinished to true', async function(){
      await this.token.finishMint({from:owner});
      const res = await this.token.isFinished();
      (res).should.be.equal(true);
    });
  });
}

module.exports = {
  mint,
  finishMint
}
