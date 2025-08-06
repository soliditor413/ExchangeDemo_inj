// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import "@openzeppelin/hardhat-upgrades";
import {writeConfig} from "./helper";

async function main() {
    let chainID = await getChainId();
    console.log("chainID ", chainID);
    let signers = await ethers.getSigners()
    let deployer = signers[0]
    console.log("deployer ", deployer.address, "balance ", await deployer.getBalance());
    const factory = await ethers.getContractFactory("MyExchange", deployer);
    const contract = await factory.deploy({
        gasLimit: 8000000,
        gasPrice: 20000000000,
        value: ethers.utils.parseEther("1")
    });
    await writeConfig(network.name, network.name, "MyExchange", contract.address);

    await contract.deployed();
    console.log("contract deployed ", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
