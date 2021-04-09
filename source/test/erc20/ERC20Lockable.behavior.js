const { constants, expectEvent, expectRevert, BN, ether, time } = require('@openzeppelin/test-helpers');
function transferWithLockUp(owner, locked, amount){
  describe('#transferWithLockUp()', function()  {
    let now;
    let due;

    beforeEach(async function()  {
      now = await time.latest();
    });

    it('should fail if locked is ZERO_ADDRESS', async function()  {
      due = now.add(await time.duration.days(1));
      await expectRevert.unspecified(this.token.transferWithLockUp(constants.ZERO_ADDRESS, amount, due, { from: owner }));
    });

    it("should fail if sender's amount is lower than balance", async function()  {
      due = now.add(await time.duration.days(1));
      const balance = await this.token.balanceOf(owner);
      await expectRevert.unspecified(
        this.token.transferWithLockUp(locked, balance.addn(1), due, { from: owner }),
      );
    });

    it('should fail if try to lock with set due to past time', async function()  {
      due = now.sub(await time.duration.days(1));
      await expectRevert.unspecified(this.token.transferWithLockUp(locked, amount, due, { from: owner }));
    });

    describe('valid case', function()  {
      let logs;
      let beforeLocked;
      let balance = {};
      beforeEach(async function()  {
        due = now.add(await time.duration.days(1));
        await this.token.transferWithLockUp(locked, amount, due, {
          from: owner,
        });
        balance.owner = await this.token.balanceOf(owner);
        balance.locked = await this.token.balanceOf(locked);
        due = now.add(await time.duration.days(2));
        beforeLocked = await this.token.totalLocked(locked);
        const receipt = await this.token.transferWithLockUp(locked, amount, due, {
          from: owner,
        });
        logs = receipt.logs;
      });

      it("sender's balance should decrease", async function()  {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(balance.owner.sub(amount));
      });

      it("locked's balance should increase", async function()  {
        let lockInfo = await this.token.totalLocked(locked);
        (await this.token.balanceOf(locked)).should.be.bignumber.equal(balance.locked.add(amount));
      });

      it('locked\'s total locked amount should increase', async function(){
        (await this.token.totalLocked(locked)).amount.should.be.bignumber.equal(beforeLocked.amount.add(amount));
        (await this.token.totalLocked(locked)).length.should.be.bignumber.equal(beforeLocked.length.add(new BN('1')));
      });

      it("locked's lock info update properly", async function()  {
        let lockInfo = await this.token.totalLocked(locked);
        lockInfo[0].should.be.bignumber.equal(amount.add(amount));
      });

      it('should emit Transfer event', async function()  {
        expectEvent.inLogs(logs, 'Transfer', {
          0: owner,
          1: locked,
          2: amount,
        });
      });

      it('should emit Lock event', async function()  {
        expectEvent.inLogs(logs, 'Lock', {
          0: locked,
          1: amount,
          2: due,
        });
      });
    });
  });
}

function unlock(owner, locked, amount){
  describe('#unlock()', function()  {
    let now, due;

    const period = [
      3,6,1,2,5,7
    ]
    beforeEach(async function()  {
      now = await time.latest();
      for(var i = 0; i< 6; i++){
        due = now.add(await time.duration.weeks(period[i]));
        await this.token.transferWithLockUp(locked, amount.muln(period[i]), due, {
          from: owner,
        });
      }
    });

    it('should fail if due is not passed', async function(){
      await time.increase(time.duration.weeks(4));
      await expectRevert(this.token.unlock(locked,1),"ERC20Lockable/unlock: cannot unlock before due");
      await expectRevert(this.token.unlock(locked,4),"ERC20Lockable/unlock: cannot unlock before due");
      await expectRevert(this.token.unlock(locked,5),"ERC20Lockable/unlock: cannot unlock before due");
    });

    describe('valid case', function()  {
      let receipt;
      let beforeBalance;
      let afterBalance;
      let beforeLockInfo;
      beforeEach(async function()  {
        beforeLockInfo = await this.token.totalLocked(locked);
        beforeBalance = await this.token.balanceOf(locked);
        await time.increase(await time.duration.weeks(1));
        await time.increase(await time.duration.days(1));
        receipt = await this.token.unlock(locked,2);
        afterBalance = await this.token.balanceOf(locked);
      });

      it("locked user's amount should increase amount of locked", async function()  {
        afterBalance.should.be.bignumber.equal(beforeBalance);
      });

      it('should delete lock information', async function()  {
        const lockInfo = await this.token.totalLocked(locked);
        lockInfo.amount.should.be.bignumber.equal(beforeLockInfo.amount.sub(amount));
        lockInfo.length.should.be.bignumber.equal(beforeLockInfo.length.sub(new BN('1')));
        const expected = [
          3,6,7,2,5
        ];
        for(var i = 0; i<lockInfo.length; i++){
          const info = await this.token.lockInfo(locked, i);
          info.amount.should.be.bignumber.equal(amount.mul(new BN(expected[i])));
          info.due.should.be.bignumber.equal(now.add(await time.duration.weeks(expected[i])));
        }
      });

      it('should emit Unlock event', function()  {
        expectEvent(receipt, 'Unlock', {
          0: locked,
          1: amount,
        });
      });
    });
  });

  describe('#unlockAll()', function()  {
    let now, due;

    const period = [
      3,4,1,2,5,7
    ]
    beforeEach(async function()  {
      now = await time.latest();
      for(var i = 0; i< 6; i++){
        due = now.add(await time.duration.weeks(period[i]));
        await this.token.transferWithLockUp(locked, amount.muln(period[i]), due, {
          from: owner,
        });
      }
    });

    describe('valid case', function()  {
      let receipt;
      let beforeBalance;
      let afterBalance;
      let beforeLockInfo;
      beforeEach(async function()  {
        beforeLockInfo = await this.token.totalLocked(locked);
        beforeBalance = await this.token.balanceOf(locked);
        await time.increase(await time.duration.weeks(1));
        await time.increase(await time.duration.days(1));
        receipt = await this.token.unlockAll(locked);
        afterBalance = await this.token.balanceOf(locked);
      });

      it("locked user's amount should increase amount of locked", async function()  {
        afterBalance.should.be.bignumber.equal(beforeBalance);
      });

      it('should delete lock information', async function()  {
        const lockInfo = await this.token.totalLocked(locked);
        lockInfo.amount.should.be.bignumber.equal(beforeLockInfo.amount.sub(amount));
        lockInfo.length.should.be.bignumber.equal(beforeLockInfo.length.sub(new BN('1')));
        const expected = [
          3,4,7,2,5
        ];
        for(var i = 0; i<lockInfo.length; i++){
          const info = await this.token.lockInfo(locked, i);
          info.amount.should.be.bignumber.equal(amount.mul(new BN(expected[i])));
          info.due.should.be.bignumber.equal(now.add(await time.duration.weeks(expected[i])));
        }
      });


      it('should be able to unlock all locks',async function(){
        await time.increase(time.duration.weeks(10));
        await this.token.unlockAll(locked);
        const lockInfo = await this.token.totalLocked(locked);
        (lockInfo.length).should.be.bignumber.equal(new BN(0));
        (lockInfo.amount).should.be.bignumber.equal(new BN(0));
      });

      it('should emit Unlock event', function()  {
        expectEvent(receipt, 'Unlock', {
          0: locked,
          1: amount,
        });
      });
    });
  });
}

function releaseLock(owner, nonOwner, locked, amount){
  describe('#releaseLock()', function()  {
    let now, due;

    beforeEach(async function()  {
      now = await time.latest();
      due = now.add(await time.duration.weeks(1));
      await this.token.transferWithLockUp(locked, amount, due, {
        from: owner,
      });
    });

    it('should fail if msg.sender is not owner', async function()  {
      await expectRevert.unspecified(this.token.releaseLock(locked, { from: nonOwner }));
    });

    describe('valid case', function()  {
      let receipt;
      let beforeBalance;
      let afterBalance;
      beforeEach(async function()  {
        beforeBalance = await this.token.balanceOf(locked);
        await time.increase(await time.duration.weeks(2));
        receipt = await this.token.releaseLock(locked, { from: owner });
        afterBalance = await this.token.balanceOf(locked);
      });

      it("locked user's amount should not change", async function()  {
        afterBalance.should.be.bignumber.equal(beforeBalance);
      });

      it('should delete lock information', async function()  {
        let lockInfo;
        lockInfo = await this.token.totalLocked(locked);
        lockInfo[0].should.be.bignumber.equal(new BN('0'));
        lockInfo[1].should.be.bignumber.equal(new BN('0'));
      });

      it('should emit Unlock event', function()  {
        expectEvent(receipt, 'Unlock', {
          0: locked,
          1: amount,
        });
      });
    });
  });
}

function checkLock(args) {
  it('should not be able to send more than user\'s unlocked balance', async function(){
    const due = (await time.latest()).add(time.duration.weeks(1));
    await this.token.transfer(this.owner, await this.token.balanceOf(args.user), {from:args.user});
    await this.token.transfer(args.user, args.amount.subn(1),{from:this.owner});
    await this.token.transferWithLockUp(args.user, args.amount, due, {from:this.owner});
    this.requireMessage = "ERC20Lockable/Cannot send more than unlocked amount";
  });
}

module.exports = {
  transferWithLockUp,
  unlock,
  releaseLock,
  checkLock
}
