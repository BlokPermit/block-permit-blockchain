const { expect } = require("chai");

describe("OwnerContract", function () {
  let ownerContract, owner1, owner2, authorizedUser1, authorizedUser2, authorizedUser3;
  let usersAddresses = [];

  beforeEach(async function () {
    const OwnerContract = await ethers.getContractFactory("OwnerContract");
    ownerContract = await OwnerContract.deploy();
    await ownerContract.deployed();

    [owner1, owner2, authorizedUser1, authorizedUser2, authorizedUser3] = await ethers.getSigners();
    usersAddresses = [authorizedUser1.address, authorizedUser2.address, authorizedUser3.address];
  });

  describe("Initialization", function () {
    it("should set the deployer as an initial owner", async function () {
      expect(await ownerContract.connect(owner1).owners(owner1.address)).to.equal(true);
    });
  });

  describe("Only Owner Modifier", function () {
    it("should only allow an owner to add a new owner", async function () {
      await expect(ownerContract.connect(authorizedUser1).addOwners([owner1.address])).to.be.revertedWith(
        "Only an authorized contract owner can perform this action"
      );
    });
    
    it("should only allow an owner to remove an existing owner", async function () {
    await expect(ownerContract.connect(authorizedUser1).removeOwners([owner2.address])).to.be.revertedWith(
        "Only an authorized contract owner can perform this action"
      );
    });

    it("should only allow an owner to authorize a user", async function () {
      await expect(ownerContract.connect(authorizedUser1).authorizeUsers(usersAddresses)).to.be.revertedWith(
        "Only an authorized contract owner can perform this action"
      );
    });

    it("should only allow an owner to unauthorize a user", async function () {
        await expect(ownerContract.connect(authorizedUser1).unauthorizeUsers(usersAddresses)).to.be.revertedWith(
          "Only an authorized contract owner can perform this action"
        );
    });
  })

  describe("Add Owner", function () {
    it("should add a new owner", async function () {
      await ownerContract.addOwners([owner2.address]);
      expect(await ownerContract.owners(owner2.address)).to.equal(true);
    });
  });

  describe("Remove Owner", function () {
    it("should remove an existing owner", async function () {
      await ownerContract.removeOwners([owner2.address]);
      expect(await ownerContract.owners(owner2.address)).to.equal(false);
    });
  });

  describe("Authorize User", function () {
    it("should authorize a user", async function () {
      await ownerContract.authorizeUsers(usersAddresses);
      expect(await ownerContract.authorizedUsers(authorizedUser1.address)).to.equal(true);
    });
  });

  describe("Unauthorize User", function () {
    it("should unauthorize a user", async function () {
      await ownerContract.unauthorizeUsers([authorizedUser1.address]);
      expect(await ownerContract.authorizedUsers(authorizedUser1.address)).to.equal(false);
    });
  });

  describe("Getter Functions", function () {
    describe("Owner Getter", function () {
      it("should return true for an existing owner", async function () {
        expect(await ownerContract.owners(owner1.address)).to.equal(true);
      });
  
      it("should return false for a non-existing owner", async function () {
        expect(await ownerContract.owners(authorizedUser1.address)).to.equal(false);
      });
    });
  
    describe("Authorized User Getter", function () {
      it("should return true for an authorized user", async function () {
        await ownerContract.authorizeUsers([authorizedUser1.address]);
  
        expect(await ownerContract.authorizedUsers(authorizedUser1.address)).to.equal(true);
      });
  
      it("should return false for a non-authorized user", async function () {
        await ownerContract.authorizeUsers([authorizedUser1.address]);

        expect(await ownerContract.authorizedUsers(authorizedUser2.address)).to.equal(false);
      });
    });
  });
  
});
