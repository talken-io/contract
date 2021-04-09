const { constants, expectEvent, expectRevert, BN, ether, time } = require('@openzeppelin/test-helpers');
function burn(burner, amount, modifiers) {
  describe('#burn()', function()  {
    describe('modifiers', function(){
      for (let i =0; i<modifiers.length; i++){
        modifiers[i]({user:burner, amount: amount});
      }
      afterEach(async function(){
        await expectRevert(this.token.burn(amount, {from:burner}), this.requireMessage);
      });
    });
    it('should fail if overflows', async function()  {
      await expectRevert.unspecified(this.token.burn(constants.MAX_UINT256, { from: burner }));
    });

    describe('valid case', function()  {
      let receipt;
      let values = {};
      beforeEach(async function()  {
        values.totalSupply = await this.token.totalSupply();
        values.burner = await this.token.balanceOf(burner);
        receipt = await this.token.burn(amount, { from: burner });
      });

      it('totalSupply should decrease', async function()  {
        (await this.token.totalSupply()).should.be.bignumber.equal(values.totalSupply.sub(amount));
      });

      it("account's balance should decrease", async function()  {
        (await this.token.balanceOf(burner)).should.be.bignumber.equal(values.burner.sub(amount));
      });

      it('should emit Transfer event', async function()  {
        expectEvent(receipt, 'Transfer', {
          0: burner,
          1: constants.ZERO_ADDRESS,
          2: amount,
        });
      });

      it('should emit Burn event', async function()  {
        expectEvent(receipt, 'Burn', {
          0: burner,
          1: amount,
        });
      });
    });
  });
}

function burnFrom(owner, burner, amount, modifiers) {
  describe('#burnFrom()', function()  {
    describe('modifiers', function(){
      beforeEach(async function(){
        await this.token.approve(burner, amount, {from:owner});
      });
      for (let i =0; i<modifiers.length; i++){
        modifiers[i]({user:owner, amount: amount});
      }
      afterEach(async function(){
        await expectRevert(this.token.burnFrom(owner, amount, {from:burner}), this.requireMessage);
      });
    });
    it('should fail if account is ZERO_ADDRESS', async function()  {
      await expectRevert.unspecified(this.token.burnFrom(constants.ZERO_ADDRESS, amount));
    });

    it("should fail if account's amount is lower than burn amount", async function()  {
      const balance = await this.token.balanceOf(owner);
      await this.token.approve(burner, balance.muln(2), {
        from: owner,
      });
      await expectRevert.unspecified(this.token.burnFrom(owner, balance.addn(1), { from: burner }));
    });

    it('should fail if allowance is lower than burn amount', async function()  {
      await this.token.approve(burner, new BN('1'), { from: owner });
      await expectRevert.unspecified(this.token.burnFrom(owner, amount, { from: burner }));
    });

    it("should fail even if try to burn account's this.token without approve process", async function()  {
      await expectRevert.unspecified(this.token.burnFrom(owner, amount, { from: owner }));
    });

    it('should fail when paused', async function()  {
      await this.token.pause({from: owner});
      await this.token.approve(burner, amount, { from: owner });
      await expectRevert.unspecified(this.token.burnFrom(owner, amount, { from: burner }));

    });

    describe('valid case', function()  {
      let receipt;
      let values = {};

      beforeEach(async function()  {
        values.totalSupply = await this.token.totalSupply();
        values.owner = await this.token.balanceOf(owner);
        values.allowance = await this.token.allowance(owner, burner);
        await this.token.approve(burner, amount, { from: owner });
        receipt = await this.token.burnFrom(owner, amount, {
          from: burner,
        });
      });

      it('totalSupply should decrease', async function()  {
        (await this.token.totalSupply()).should.be.bignumber.equal(values.totalSupply.sub(amount));
      });

      it("account's balance should decrease", async function()  {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(values.owner.sub(amount));
      });

      it('should emit Transfer event', async function()  {
        expectEvent(receipt, 'Transfer', {
          0: owner,
          1: constants.ZERO_ADDRESS,
          2: amount,
        });
      });

      it('allowance should decrease', async function()  {
        (await this.token.allowance(owner, burner)).should.be.bignumber.equal(new BN('0'));
      });

      it('should emit Approval event', async function()  {
        expectEvent(receipt, 'Approval', {
          0: owner,
          1: burner,
          2: new BN('0'),
        });
      });

      it('should emit Burn event', async function()  {
        expectEvent(receipt, 'Burn', {
          0: owner,
          1: amount,
        });
      });
    });
  });
}

module.exports = {
  burn,
  burnFrom
}
