import hre from "hardhat";
import fs from "fs";

async function main() {
  console.log("🚀 Deploying SyntheticDataMarket to Sepolia testnet...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Get the contract factory
  const SyntheticDataMarket = await hre.ethers.getContractFactory("SyntheticDataMarket");

  // Set initial quality verifier address (can be changed later by owner)
  // Using deployer address as initial verifier - you can change this
  const initialVerifier = deployer.address;
  console.log("🔐 Initial quality verifier:", initialVerifier);

  // Deploy the contract
  console.log("\n⏳ Deploying contract...");
  const contract = await SyntheticDataMarket.deploy(initialVerifier);

  // Wait for deployment to complete
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("\n✅ SyntheticDataMarket deployed successfully!");
  console.log("📋 Contract address:", contractAddress);
  console.log("🔗 Network:", hre.network.name);
  console.log("⛽ Gas used: Check Etherscan for details\n");

  // Display important information
  console.log("=" .repeat(60));
  console.log("📝 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(60));
  console.log("Contract Name:      SyntheticDataMarket");
  console.log("Contract Address:  ", contractAddress);
  console.log("Network:           ", hre.network.name);
  console.log("Deployer:          ", deployer.address);
  console.log("Initial Verifier:  ", initialVerifier);
  console.log("=" .repeat(60));

  // Save deployment info to file
  const deploymentInfo = {
    network: hre.network.name,
    contractName: "SyntheticDataMarket",
    contractAddress: contractAddress,
    deployer: deployer.address,
    initialVerifier: initialVerifier,
    deploymentDate: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  const deploymentPath = './deployment-info.json';
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  // Get contract ABI and save it
  const artifactPath = './artifacts/contracts/SyntheticDataMarket.sol/SyntheticDataMarket.json';
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Save ABI for backend
    const backendAbiPath = './backend/contracts/SyntheticDataMarket.json';
    fs.mkdirSync('./backend/contracts', { recursive: true });
    fs.writeFileSync(backendAbiPath, JSON.stringify({ abi: artifact.abi }, null, 2));
    console.log("📄 ABI saved to:", backendAbiPath);
  }

  console.log("\n" + "=" .repeat(60));
  console.log("📋 NEXT STEPS");
  console.log("=" .repeat(60));
  console.log("1. Update backend/.env:");
  console.log("   CONTRACT_ADDRESS=" + contractAddress);
  console.log("");
  console.log("2. Update frontend/.env:");
  console.log("   VITE_CONTRACT_ADDRESS=" + contractAddress);
  console.log("");
  console.log("3. Verify contract on Etherscan (optional):");
  console.log("   npx hardhat verify --network sepolia " + contractAddress + " " + initialVerifier);
  console.log("");
  console.log("4. View on Sepolia Etherscan:");
  console.log("   https://sepolia.etherscan.io/address/" + contractAddress);
  console.log("=" .repeat(60) + "\n");

  // Wait for a few block confirmations
  console.log("⏳ Waiting for 5 block confirmations...");
  const deploymentReceipt = await contract.deploymentTransaction().wait(5);
  console.log("✅ Contract confirmed after 5 blocks\n");

  console.log("🎉 Deployment complete! Contract is ready to use.");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
