// @ts-ignore
import { network, ethers, getChainId } from 'hardhat'
import "@openzeppelin/hardhat-upgrades";
import {readConfig} from "./helper";

async function main() {
    try {
        let chainID = await getChainId();
        console.log("chainID ", chainID);
        let signers = await ethers.getSigners()
        let deployer = signers[0]
        console.log("deployer ", deployer.address, "balance ", ethers.utils.formatUnits(await deployer.getBalance(), 18));

        const factory = await ethers.getContractFactory("ExchangeDemo", deployer);
        const contractAddress = await readConfig(network.name, "ExchangeDemo");
        console.log("contractAddress ", contractAddress);

        const contract = factory.attach(contractAddress).connect(deployer);
        const subaccountID = contractAddress + "000000000000000000000001";
        console.log("subaccountID ", subaccountID);

        const amount = ethers.utils.parseUnits("1", 6);
        console.log("amount ", amount.toString());

        // Increase gas price
        const gasPrice = await ethers.provider.getGasPrice();
        const increasedGasPrice = gasPrice.mul(2); // Double the current gas price
        console.log(`Using gas price: ${ethers.utils.formatUnits(increasedGasPrice, 'gwei')} gwei`);

        // Add retry logic
        let retries = 3;
        let receipt;

        while (retries > 0) {
            try {
                const gasLimit = await contract.estimateGas.withdraw(subaccountID, "inj", amount);
                console.log("gaslimit ", gasLimit.toString());
                const tx = await contract.withdraw(subaccountID, "inj", amount, {
                    gasLimit: gasLimit.mul(12).div(10), // Add 20% buffer
                    gasPrice: increasedGasPrice
                });

                console.log("Transaction hash:", tx.hash);
                receipt = await tx.wait();
                console.log("Transaction confirmed in block:", receipt.blockNumber);
                break; // Exit loop if successful
            } catch (error) {
                retries--;
                if (retries === 0) throw error;
                console.log(`Retrying... ${retries} attempts left`);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
            }
        }

        console.log("Deposit successful!", receipt);
    } catch (error) {
        console.error("Error in deposit transaction:", error);
        process.exit(1);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
