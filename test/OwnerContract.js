const { expect } = require("chai");

describe("OwnerContract", function () {
  let ownerContract, owner, authorizedUser;

  beforeEach(async function () {
    const OwnerContract = await ethers.getContractFactory("OwnerContract");
    ownerContract = await OwnerContract.deploy();
    await ownerContract.deployed();

    [owner, authorizedUser, otherUser] = await ethers.getSigners();
  });

  describe("Initialization", function () {
    it("should set the deployer as an initial owner", async function () {
      expect(await ownerContract.isOwner(owner.address)).to.equal(true);
    });
  });

  describe("Only Owner Modifier", function () {
    it("should only allow an owner to add a new owner", async function () {
      await expect(ownerContract.connect(authorizedUser).addOwner(owner.address)).to.be.revertedWith(
        "Only an authorized contract owner can perform this action"
      );
    });
    
    it("should only allow an owner to remove an existing owner", async function () {
    await expect(ownerContract.connect(authorizedUser).removeOwner(owner.address)).to.be.revertedWith(
        "Only an authorized contract owner can perform this action"
      );
    });

    it("should only allow an owner to authorize a user", async function () {
      await expect(ownerContract.connect(authorizedUser).authorizeUser(owner.address)).to.be.revertedWith(
        "Only an authorized contract owner can perform this action"
      );
    });

    it("should only allow an owner to unauthorize a user", async function () {
        await expect(ownerContract.connect(authorizedUser).unauthorizeUser(owner.address)).to.be.revertedWith(
          "Only an authorized contract owner can perform this action"
        );
    });
  })

  describe("Add Owner", function () {
    it("should add a new owner", async function () {
      await ownerContract.addOwner(authorizedUser.address);
      expect(await ownerContract.isOwner(authorizedUser.address)).to.equal(true);
    });
  });

  describe("Remove Owner", function () {
    it("should remove an existing owner", async function () {
      await ownerContract.removeOwner(owner.address);
      expect(await ownerContract.isOwner(owner.address)).to.equal(false);
    });
  });

  describe("Authorize User", function () {
    it("should authorize a user", async function () {
      await ownerContract.authorizeUser(authorizedUser.address);
      expect(await ownerContract.isAuthorized(authorizedUser.address)).to.equal(true);
    });
  });

  describe("Unauthorize User", function () {
    it("should unauthorize a user", async function () {
      await ownerContract.unauthorizeUser(authorizedUser.address);
      expect(await ownerContract.isAuthorized(authorizedUser.address)).to.equal(false);
    });
  });

  describe("Getter Functions", function () {
    describe("Owner Getter", function () {
      it("should return true for an existing owner", async function () {
        expect(await ownerContract.isOwner(owner.address)).to.equal(true);
      });
  
      it("should return false for a non-existing owner", async function () {
        expect(await ownerContract.isOwner(otherUser.address)).to.equal(false);
      });

      it("should return false for a authorized user", async function () {
        await ownerContract.authorizeUser(authorizedUser.address);

        expect(await ownerContract.isOwner(authorizedUser.address)).to.equal(false);
      });
    });
  
    describe("Authorized User Getter", function () {
      it("should return true for an authorized user", async function () {
        await ownerContract.authorizeUser(authorizedUser.address);
  
        expect(await ownerContract.isAuthorized(authorizedUser.address)).to.equal(true);
      });
  
      it("should return false for a non-authorized user", async function () {
        await ownerContract.authorizeUser(authorizedUser.address);

        expect(await ownerContract.isAuthorized(otherUser.address)).to.equal(false);
      });
    });
  });
  
});
