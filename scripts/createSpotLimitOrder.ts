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
        const price=100

        const order = {
            marketID: MARKET_ID, // Replace with actual market ID
            subaccountID: subaccountID,
            feeRecipient: "inj1qf32krkk2deuep2ux3fflh025rngdkgnp6vzkg",
            price: price, // Example price, adjust as needed
            quantity: 1, // Example quantity, adjust as needed
            cid: orderId, // Unique client order ID
            orderType: "sell", // or "sell", "buyPostOnly", "sellPostOnly"
            triggerPrice: 0 // Set to 0 if not a stop/take order
        };

        console.log("Creating spot order with params:", {
            ...order,
            price: order.price.toString(),
            quantity: order.quantity.toString(),
        });

        // Get current gas price and increase it
        const gasPrice = await ethers.provider.getGasPrice();
        const increasedGasPrice = gasPrice.mul(2);
        console.log(`Using gas price: ${ethers.utils.formatUnits(increasedGasPrice, 'gwei')} gwei`);

        // Add retry logic
        let receipt;
        // Estimate gas for the transaction
        const gasEstimate = await contract.estimateGas.createSpotLimitOrder(order);
        console.log("Gas estimate:", gasEstimate.toString());
        // Send the transaction with a 20% gas buffer
         const tx = await contract.createSpotLimitOrder(order, {
             gasLimit: gasEstimate.mul(12).div(10),
             gasPrice: increasedGasPrice
         });

         console.log("Transaction hash:", tx.hash);
         receipt = await tx.wait();
         console.log("Transaction confirmed in block:", receipt.blockNumber);

         // Parse the logs to get the order hash
         const event = receipt.events?.find((e: any) => e.event === "DerivativeLimitOrderCreated");
         if (event) {
             console.log("Order created with hash:", event.args?.orderHash);
             console.log("Order CID:", event.args?.cid);
         }

         console.log("Order created successfully!");
    } catch (error) {
        console.error("Error in createSpotLimitOrder transaction:", error);
        process.exit(1);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});