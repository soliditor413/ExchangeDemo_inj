// @ts-ignore
import { network, ethers, getChainId } from 'hardhat'
import { readConfig } from "./helper";

async function main() {
    try {
        const MARKET_ID= "0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe";
        let chainID = await getChainId();
        console.log("chainID ", chainID);

        let signers = await ethers.getSigners();
        let deployer = signers[0];
        console.log("deployer ", deployer.address, "balance ", ethers.utils.formatEther(await deployer.getBalance()));

        const factory = await ethers.getContractFactory("MyExchange", deployer);
        const contractAddress = await readConfig(network.name, "MyExchange");
        console.log("contractAddress ", contractAddress);

        const contract = factory.attach(contractAddress).connect(deployer);
        const subaccountID = contractAddress + "000000000000000000000001";
        console.log("subaccountID ", subaccountID);
        const orderId = "spot-zxb-0-01" ;


        // Get current gas price and increase it
        const gasPrice = await ethers.provider.getGasPrice();
        const increasedGasPrice = gasPrice.mul(2);
        const orderHash = "";
        console.log(`Using gas price: ${ethers.utils.formatUnits(increasedGasPrice, 'gwei')} gwei`);

        // Add retry logic
        let receipt;
        // Estimate gas for the transaction
        const gasEstimate = await contract.estimateGas.cancelSpotOrder(MARKET_ID, subaccountID, orderHash,orderId);
        console.log("Gas estimate:", gasEstimate.toString());
        // Send the transaction with a 20% gas buffer
        const tx = await contract.cancelSpotOrder(MARKET_ID, subaccountID, orderHash,orderId, {
            gasLimit: gasEstimate.mul(12).div(10),
            gasPrice: increasedGasPrice
        });

        console.log("Transaction hash:", tx.hash);
        receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);

        // Parse the logs to get the order hash
        const event = receipt.events?.find((e: any) => e.event === "DerivativeLimitOrderCreated");
        if (event) {
            console.log("cancel Order with hash:", event.args?.orderHash);
        }

        console.log("Order cancelled successfully!");
    } catch (error) {
        console.error("Error in cancelled transaction:", error);
        process.exit(1);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});