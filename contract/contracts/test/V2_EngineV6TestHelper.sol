// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../V2_EngineV6.sol";

/**
 * @title V2_EngineV6TestHelper
 * @notice Helper contract for testing V6 without requiring full upgrade path
 * @dev This contract bypasses the upgrade path for testing purposes only
 *      Replicates the state that would exist after V1->V2->V3->V4->V5->V5_2->V6 upgrades
 */
contract V2_EngineV6TestHelper is V2_EngineV6 {
    /**
     * @notice Initialize the contract directly without requiring previous versions
     * @dev For testing only - production uses upgrade path through V1->V6
     * @param basetoken_ The base token address
     * @param treasury_ The treasury address
     */
    function initializeForTesting(
        address basetoken_,
        address treasury_
    ) public initializer {
        // V1 initialization
        __Ownable_init();

        baseToken = IBaseToken(basetoken_);
        treasury = treasury_;
        paused = false;

        // V2 state (set via setSolutionStakeAmount after V2 upgrade)
        solutionsStakeAmount = 0.001 ether;
        startBlockTime = uint64(block.timestamp);

        // V3 initialization
        minClaimSolutionTime = 3600; // 60 minutes
        minContestationVotePeriodTime = 360; // 6 minutes
        exitValidatorMinUnlockTime = 259200; // 3 days
        solutionRateLimit = 1 ether; // 1 second required between solution submissions
        taskOwnerRewardPercentage = 0.1 ether; // 10%
        contestationVoteExtensionTime = 10; // 10 seconds
        totalHeld = 0; // Start at 0 for testing (V4 resets this anyway)

        // V4 initialization
        totalHeld = 0; // Reset
        version = 4;
        // startBlockTime already set in V2

        // V5 initialization
        version = 5;
        solutionModelFeePercentage = 1 ether; // 100%
        validatorMinimumPercentage = 0.0024 ether; // 0.24%
        slashAmountPercentage = 0.00001 ether; // 0.001% of total supply
        solutionsStakeAmount = 0.001 ether; // 0.001 aius

        // V5_2 initialization (empty, just bumps reinitializer)

        // V6 initialization
        version = 6;
        masterContesterVoteAdder = 50;

        // Additional default values that may be set post-deploy
        validatorMinimumPercentage = 50;
        slashAmountPercentage = 10;
        solutionFeePercentage = 5;
        solutionModelFeePercentage = 50;
        retractionFeePercentage = 5;
        treasuryRewardPercentage = 1;
        minRetractionWaitTime = 60 * 5;
        maxContestationValidatorStakeSince = 60 * 60 * 24;
    }
}
