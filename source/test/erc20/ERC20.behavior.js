const { constants, expectEvent, expectRevert, BN, ether, time } = require('@openzeppelin/test-helpers');

function constructor(name, symbol, decimals, INITIAL_SUPPLY, owner) {
  describe('#constructor()', function()  {
    it('contract caller set to owner', async function()  {
      (await this.token.owner()).should.be.equal(owner);
    });

    it("contract initializer's balance set to initial supply", async function()  {
      (await this.token.balanceOf(owner)).should.be.bignumber.equal(INITIAL_SUPPLY);
    });

    it('name, symbol, decimals set properly', async function()  {
      (await this.token.name()).should.be.equal(name);
      (await this.token.symbol()).should.be.equal(symbol);
      (await this.token.decimals()).should.be.bignumber.equal(decimals);
    });
  });
}

function transfer(sender, recipient, amount, modifiers){
  describe('#transfer()', function()  {
    for (let i =0; i<modifiers.length; i++){
      describe('modifiers', function(){
        modifiers[i]({user:sender, amount: amount});
        after(async function(){
          await expectRevert(this.token.transfer(recipient, amount, {from:sender}), this.requireMessage);
        });
      });
    };

    it('should fail if recipient is ZERO_ADDRESS', async function()  {
      await expectRevert.unspecified(this.token.transfer(constants.ZERO_ADDRESS, amount, { from: sender }));
    });

    it("should fail if sender's amount is lower than balance", async function()  {
      const balance = await this.token.balanceOf(sender);
      await expectRevert.unspecified(this.token.transfer(recipient, balance.add(new BN('1')), { from: sender }));
    });

    context('when succeeded', function()  {
      let logs;
      let balance = {};

      beforeEach(async function()  {
        balance.sender = await this.token.balanceOf(sender);
        balance.recipient = await this.token.balanceOf(recipient);
        const receipt = await this.token.transfer(recipient, amount, {
          from: sender,
        });
        logs = receipt.logs;
      });

      it("sender's balance should decrease", async function()  {
        (await this.token.balanceOf(sender)).should.be.bignumber.equal(balance.sender.sub(amount));
      });

      it("recipient's balance should increase", async function()  {
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(balance.recipient.add(amount));
      });

      it('should emit Transfer event', async function()  {
        expectEvent.inLogs(logs, 'Transfer', {
          0: sender,
          1: recipient,
          2: amount,
        });
      });
    });
  });
};

function transferFrom(sender, recipient, spender, amount, modifiers) {
  describe('#transferFrom()', function()  {
    for (let i =0; i<modifiers.length; i++){
      describe('modifiers', function(){
        before(async function(){
          await this.token.approve(spender, amount, {from:sender});
        });
        modifiers[i]({user:sender, amount: amount});
        after(async function(){
          await expectRevert(this.token.transferFrom(sender, recipient, amount, {from:spender}), this.requireMessage);
        });
      });
    }

    it('should fail if sender is ZERO_ADDRESS', async function()  {
      // await this.token.approve(spender, amount, {from: constants.ZERO_ADDRESS});
      await expectRevert.unspecified(
        this.token.transferFrom(constants.ZERO_ADDRESS, recipient, amount, {
          from: spender,
        }),
      );
    });

    it('should fail if recipient is ZERO_ADDRESS', async function()  {
      await this.token.approve(spender, amount, { from: sender });
      await expectRevert.unspecified(
        this.token.transferFrom(sender, constants.ZERO_ADDRESS, amount, {
          from: spender,
        }),
      );
    });

    it("should fail if sender's amount is lower than transfer amount", async function()  {
      const balance = await this.token.balanceOf(sender);
      await this.token.approve(spender, balance.mul(new BN('2')), { from: sender });
      await expectRevert.unspecified(
        this.token.transferFrom(sender, recipient, balance.add(new BN('1')), {
          from: spender,
        }),
      );
    });

    it('should fail if allowance is lower than transfer amount', async function()  {
      await this.token.approve(spender, amount.subn(1), { from: spender });
      await expectRevert.unspecified(this.token.transferFrom(sender, recipient, amount, { from: spender }));
    });

    it("should fail even if try to transfer sender's token without approve process", async function()  {
      await expectRevert.unspecified(this.token.transferFrom(sender, recipient, amount, { from: spender }));
    });

    context('when succeeded', function()  {
      let logs;
      let balance = {};

      beforeEach(async function()  {
        balance.sender = await this.token.balanceOf(sender);
        balance.recipient = await this.token.balanceOf(recipient);
        await this.token.approve(spender, amount, { from: sender });
        const receipt = await this.token.transferFrom(sender, recipient, amount, {
          from: spender,
        });
        logs = receipt.logs;
      });

      it("sender's balance should decrease", async function()  {
        (await this.token.balanceOf(sender)).should.be.bignumber.equal(balance.sender.sub(amount));
      });

      it("recipient's balance should increase", async function()  {
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(balance.recipient.add(amount));
      });

      it('should emit Transfer event', async function()  {
        expectEvent.inLogs(logs, 'Transfer', {
          0: sender,
          1: recipient,
          2: amount,
        });
      });

      it('allowance should decrease', async function()  {
        (await this.token.allowance(sender, spender)).should.be.bignumber.equal(amount.sub(amount));
      });

      it('should emit Approval event', async function()  {
        expectEvent.inLogs(logs, 'Approval', {
          0: sender,
          1: spender,
          2: amount.sub(amount),
        });
      });
    });
  });
}

function approve(sender, spender, amount) {
  describe('#approve()', function()  {
    it('should fail if spender is ZERO_ADDRESS', async function()  {
      await expectRevert.unspecified(this.token.approve(constants.ZERO_ADDRESS, amount, { from: sender }));
    });

    describe('valid case', function()  {
      var logs;

      beforeEach(async function()  {
        const receipt = await this.token.approve(spender, amount, { from: sender });
        logs = receipt.logs;
      });

      it('allowance should set appropriately', async function()  {
        (await this.token.allowance(sender, spender)).should.be.bignumber.equal(amount);
      });

      it('should emit Approval event', async function()  {
        expectEvent.inLogs(logs, 'Approval', {
          0: sender,
          1: spender,
          2: amount,
        });
      });
    });
  });
}

module.exports = {
  constructor,
  transfer,
  transferFrom,
  approve
}
