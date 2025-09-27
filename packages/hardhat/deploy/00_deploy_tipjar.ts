import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployTipJar: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("TipJar", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying
  const tipJar = await hre.ethers.getContract("TipJar", deployer);
  console.log("👋 TipJar deployed to:", tipJar.address);
};

export default deployTipJar;
deployTipJar.tags = ["TipJar"];