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
        const deployerBalance = await deployer.getBalance();
        console.log("deployer ", deployer.address, "balance ", ethers.utils.formatUnits(deployerBalance, 18));

        const factory = await ethers.getContractFactory("MyExchange", deployer);
        const contractAddress = await readConfig(network.name, "MyExchange");
        console.log("contractAddress ", contractAddress);

        const contract = factory.attach(contractAddress).connect(deployer);
        const subaccountID = contractAddress + "000000000000000000000001";
        console.log("subaccountID ", subaccountID);

        // Check contract balance first
        let contractBalance = await ethers.provider.getBalance(contractAddress);
        console.log("Contract INJ balance before funding:", ethers.utils.formatEther(contractBalance));

        // If contract balance is less than 0.5 INJ, send some INJ to it
        if (contractBalance.lt(ethers.utils.parseEther("0.5"))) {
            console.log("Sending 0.5 INJ to contract for gas...");
            const tx = await deployer.sendTransaction({
                to: contractAddress,
                value: ethers.utils.parseEther("0.5"),
                gasLimit: 21000
            });
            await tx.wait();
            console.log("Sent 0.5 INJ to contract. Tx hash:", tx.hash);
            
            // Check new contract balance
            contractBalance = await ethers.provider.getBalance(contractAddress);
            console.log("Contract INJ balance after funding:", ethers.utils.formatEther(contractBalance));
        }

        // Try with a smaller amount first (0.1 INJ)
        const amount = ethers.utils.parseUnits("1", 18);
        console.log("Attempting to deposit amount:", ethers.utils.formatEther(amount), "INJ");

        // Increase gas price
        const gasPrice = await ethers.provider.getGasPrice();
        const increasedGasPrice = gasPrice.mul(3);
        console.log(`Using gas price: ${ethers.utils.formatUnits(increasedGasPrice, 'gwei')} gwei`);

        // Add retry logic
        let retries = 3;
        let receipt;

        while (retries > 0) {
            try {
                console.log("Estimating gas...");
                const gasEstimate = await contract.estimateGas.deposit(subaccountID, "inj", amount);
                console.log("Estimated gas:", gasEstimate.toString());
                
                const tx = await contract.deposit(subaccountID, "inj", amount, {
                    gasLimit: gasEstimate.mul(12).div(10), // Add 20% buffer
                    gasPrice: increasedGasPrice
                });

                console.log("Deposit transaction hash:", tx.hash);
                receipt = await tx.wait();
                console.log("Transaction confirmed in block:", receipt.blockNumber);
                console.log("Deposit successful!");
                console.log("Transaction receipt:", JSON.stringify(receipt, null, 2));
                break; // Exit loop if successful
            } catch (error) {
                retries--;
                console.error(`Attempt ${3 - retries} failed:`);
                if (error.data) {
                    console.error("Error data:", error.data);
                }
                if (error.reason) {
                    console.error("Error reason:", error.reason);
                }
                if (error.error?.data) {
                    console.error("Revert reason:", error.error.data);
                }
                if (retries === 0) {
                    console.error("Final error after all retries:", error);
                    throw error;
                }
                console.log(`Retrying... ${retries} attempts left`);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
            }
        }
    } catch (error) {
        console.error("Error in deposit transaction:");
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
        if (error.error?.data) {
            console.error("Revert data:", error.error.data);
        }
        console.error("Full error:", error);
        process.exit(1);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
