export const ABI_JSON = [
    {
        "type": "constructor",
        "stateMutability": "undefined",
        "payable": false,
        "inputs": []
    },
    {
        "type": "error",
        "name": "PRBMath_MulDiv18_Overflow",
        "inputs": [
            {
                "type": "uint256",
                "name": "x"
            },
            {
                "type": "uint256",
                "name": "y"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_MulDiv_Overflow",
        "inputs": [
            {
                "type": "uint256",
                "name": "x"
            },
            {
                "type": "uint256",
                "name": "y"
            },
            {
                "type": "uint256",
                "name": "denominator"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Abs_MinSD59x18",
        "inputs": []
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Div_InputTooSmall",
        "inputs": []
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Div_Overflow",
        "inputs": [
            {
                "type": "int256",
                "name": "x"
            },
            {
                "type": "int256",
                "name": "y"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Exp2_InputTooBig",
        "inputs": [
            {
                "type": "int256",
                "name": "x"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Mul_InputTooSmall",
        "inputs": []
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Mul_Overflow",
        "inputs": [
            {
                "type": "int256",
                "name": "x"
            },
            {
                "type": "int256",
                "name": "y"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_UD60x18_Exp2_InputTooBig",
        "inputs": [
            {
                "type": "uint256",
                "name": "x"
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ContestationSubmitted",
        "inputs": [
            {
                "type": "address",
                "name": "addr",
                "indexed": true
            },
            {
                "type": "bytes32",
                "name": "task",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ContestationVote",
        "inputs": [
            {
                "type": "address",
                "name": "addr",
                "indexed": true
            },
            {
                "type": "bytes32",
                "name": "task",
                "indexed": true
            },
            {
                "type": "bool",
                "name": "yea",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ContestationVoteFinish",
        "inputs": [
            {
                "type": "bytes32",
                "name": "id",
                "indexed": true
            },
            {
                "type": "uint32",
                "name": "start_idx",
                "indexed": true
            },
            {
                "type": "uint32",
                "name": "end_idx",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ExitValidatorMinUnlockTimeChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "amount",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "Initialized",
        "inputs": [
            {
                "type": "uint8",
                "name": "version",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "MaxContestationValidatorStakeSinceChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "amount",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "MinClaimSolutionTimeChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "amount",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "MinContestationVotePeriodTimeChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "amount",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "MinRetractionWaitTimeChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "amount",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ModelRegistered",
        "inputs": [
            {
                "type": "bytes32",
                "name": "id",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "OwnershipTransferred",
        "inputs": [
            {
                "type": "address",
                "name": "previousOwner",
                "indexed": true
            },
            {
                "type": "address",
                "name": "newOwner",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "PausedChanged",
        "inputs": [
            {
                "type": "bool",
                "name": "paused",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "PauserTransferred",
        "inputs": [
            {
                "type": "address",
                "name": "to",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "RetractionFeePercentageChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "amount",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "SignalCommitment",
        "inputs": [
            {
                "type": "address",
                "name": "addr",
                "indexed": true
            },
            {
                "type": "bytes32",
                "name": "commitment",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "SignalSupport",
        "inputs": [
            {
                "type": "address",
                "name": "addr",
                "indexed": true
            },
            {
                "type": "bytes32",
                "name": "model",
                "indexed": true
            },
            {
                "type": "bool",
                "name": "supported",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "SlashAmountPercentageChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "amount",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "SolutionClaimed",
        "inputs": [
            {
                "type": "address",
                "name": "addr",
                "indexed": true
            },
            {
                "type": "bytes32",
                "name": "task",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "SolutionFeePercentageChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "amount",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "SolutionMineableRateChange",
        "inputs": [
            {
                "type": "bytes32",
                "name": "id",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "rate",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "SolutionStakeAmountChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "amount",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "SolutionSubmitted",
        "inputs": [
            {
                "type": "address",
                "name": "addr",
                "indexed": true
            },
            {
                "type": "bytes32",
                "name": "task",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "StartBlockTimeChanged",
        "inputs": [
            {
                "type": "uint64",
                "name": "startBlockTime",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "TaskRetracted",
        "inputs": [
            {
                "type": "bytes32",
                "name": "id",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "TaskSubmitted",
        "inputs": [
            {
                "type": "bytes32",
                "name": "id",
                "indexed": true
            },
            {
                "type": "bytes32",
                "name": "model",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "fee",
                "indexed": false
            },
            {
                "type": "address",
                "name": "sender",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "TreasuryRewardPercentageChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "amount",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "TreasuryTransferred",
        "inputs": [
            {
                "type": "address",
                "name": "to",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ValidatorDeposit",
        "inputs": [
            {
                "type": "address",
                "name": "addr",
                "indexed": true
            },
            {
                "type": "address",
                "name": "validator",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "amount",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ValidatorMinimumPercentageChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "amount",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ValidatorWithdraw",
        "inputs": [
            {
                "type": "address",
                "name": "addr",
                "indexed": true
            },
            {
                "type": "address",
                "name": "to",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "count",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "amount",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ValidatorWithdrawCancelled",
        "inputs": [
            {
                "type": "address",
                "name": "addr",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "count",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ValidatorWithdrawInitiated",
        "inputs": [
            {
                "type": "address",
                "name": "addr",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "count",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "unlockTime",
                "indexed": false
            },
            {
                "type": "uint256",
                "name": "amount",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "VersionChanged",
        "inputs": [
            {
                "type": "uint256",
                "name": "version",
                "indexed": false
            }
        ]
    },
    {
        "type": "function",
        "name": "accruedFees",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "baseToken",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "cancelValidatorWithdraw",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "count_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "claimSolution",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": "taskid_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "commitments",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "contestationVoteFinish",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": "taskid_"
            },
            {
                "type": "uint32",
                "name": "amnt_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "contestationVoteNays",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": ""
            },
            {
                "type": "uint256",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "address",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "contestationVoteYeas",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": ""
            },
            {
                "type": "uint256",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "address",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "contestationVoted",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": ""
            },
            {
                "type": "address",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "contestationVotedIndex",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "contestations",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "address",
                "name": "validator"
            },
            {
                "type": "uint64",
                "name": "blocktime"
            },
            {
                "type": "uint32",
                "name": "finish_start_index"
            },
            {
                "type": "uint256",
                "name": "slashAmount"
            }
        ]
    },
    {
        "type": "function",
        "name": "diffMul",
        "constant": true,
        "stateMutability": "pure",
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "t"
            },
            {
                "type": "uint256",
                "name": "ts"
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "exitValidatorMinUnlockTime",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "generateCommitment",
        "constant": true,
        "stateMutability": "pure",
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "sender_"
            },
            {
                "type": "bytes32",
                "name": "taskid_"
            },
            {
                "type": "bytes",
                "name": "cid_"
            }
        ],
        "outputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "generateIPFSCID",
        "constant": true,
        "stateMutability": "pure",
        "payable": false,
        "inputs": [
            {
                "type": "bytes",
                "name": "content_"
            }
        ],
        "outputs": [
            {
                "type": "bytes",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "getPsuedoTotalSupply",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "getReward",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "getSlashAmount",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "getValidatorMinimum",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "hashModel",
        "constant": true,
        "stateMutability": "pure",
        "payable": false,
        "inputs": [
            {
                "type": "tuple",
                "name": "o_",
                "components": [
                    {
                        "type": "uint256",
                        "name": "fee"
                    },
                    {
                        "type": "address",
                        "name": "addr"
                    },
                    {
                        "type": "uint256",
                        "name": "rate"
                    },
                    {
                        "type": "bytes",
                        "name": "cid"
                    }
                ]
            },
            {
                "type": "address",
                "name": "sender_"
            }
        ],
        "outputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "hashTask",
        "constant": true,
        "stateMutability": "pure",
        "payable": false,
        "inputs": [
            {
                "type": "tuple",
                "name": "o_",
                "components": [
                    {
                        "type": "bytes32",
                        "name": "model"
                    },
                    {
                        "type": "uint256",
                        "name": "fee"
                    },
                    {
                        "type": "address",
                        "name": "owner"
                    },
                    {
                        "type": "uint64",
                        "name": "blocktime"
                    },
                    {
                        "type": "uint8",
                        "name": "version"
                    },
                    {
                        "type": "bytes",
                        "name": "cid"
                    }
                ]
            },
            {
                "type": "address",
                "name": "sender_"
            },
            {
                "type": "bytes32",
                "name": "prevhash_"
            }
        ],
        "outputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "initialize",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "baseToken_"
            },
            {
                "type": "address",
                "name": "treasury_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "initiateValidatorWithdraw",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "lastContestationLossTime",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "maxContestationValidatorStakeSince",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "minClaimSolutionTime",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "minContestationVotePeriodTime",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "minRetractionWaitTime",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "models",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": "fee"
            },
            {
                "type": "address",
                "name": "addr"
            },
            {
                "type": "uint256",
                "name": "rate"
            },
            {
                "type": "bytes",
                "name": "cid"
            }
        ]
    },
    {
        "type": "function",
        "name": "owner",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "paused",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "bool",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "pauser",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "pendingValidatorWithdrawRequests",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": ""
            },
            {
                "type": "uint256",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": "unlockTime"
            },
            {
                "type": "uint256",
                "name": "amount"
            }
        ]
    },
    {
        "type": "function",
        "name": "pendingValidatorWithdrawRequestsCount",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "prevhash",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "registerModel",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "addr_"
            },
            {
                "type": "uint256",
                "name": "fee_"
            },
            {
                "type": "bytes",
                "name": "template_"
            }
        ],
        "outputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "renounceOwnership",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": []
    },
    {
        "type": "function",
        "name": "retractTask",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": "taskid_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "retractionFeePercentage",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "reward",
        "constant": true,
        "stateMutability": "pure",
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "t"
            },
            {
                "type": "uint256",
                "name": "ts"
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "setExitValidatorMinUnlockTime",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setMaxContestationValidatorStakeSince",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setMinClaimSolutionTime",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setMinContestationVotePeriodTime",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setMinRetractionWaitTime",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setPaused",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "bool",
                "name": "paused_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setRetractionFeePercentage",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setSlashAmountPercentage",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setSolutionFeePercentage",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setSolutionMineableRate",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": "model_"
            },
            {
                "type": "uint256",
                "name": "rate_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setSolutionStakeAmount",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setStartBlockTime",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint64",
                "name": "startBlockTime_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setTreasuryRewardPercentage",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setValidatorMinimumPercentage",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setVersion",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "version_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "signalCommitment",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": "commitment_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "signalSupport",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": "model_"
            },
            {
                "type": "bool",
                "name": "support_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "slashAmountPercentage",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "solutionFeePercentage",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "solutions",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "address",
                "name": "validator"
            },
            {
                "type": "uint64",
                "name": "blocktime"
            },
            {
                "type": "bool",
                "name": "claimed"
            },
            {
                "type": "bytes",
                "name": "cid"
            }
        ]
    },
    {
        "type": "function",
        "name": "solutionsStake",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "solutionsStakeAmount",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "startBlockTime",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint64",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "submitContestation",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": "taskid_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "submitSolution",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": "taskid_"
            },
            {
                "type": "bytes",
                "name": "cid_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "submitTask",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint8",
                "name": "version_"
            },
            {
                "type": "address",
                "name": "owner_"
            },
            {
                "type": "bytes32",
                "name": "model_"
            },
            {
                "type": "uint256",
                "name": "fee_"
            },
            {
                "type": "bytes",
                "name": "input_"
            }
        ],
        "outputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "targetTs",
        "constant": true,
        "stateMutability": "pure",
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "t"
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "tasks",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "bytes32",
                "name": "model"
            },
            {
                "type": "uint256",
                "name": "fee"
            },
            {
                "type": "address",
                "name": "owner"
            },
            {
                "type": "uint64",
                "name": "blocktime"
            },
            {
                "type": "uint8",
                "name": "version"
            },
            {
                "type": "bytes",
                "name": "cid"
            }
        ]
    },
    {
        "type": "function",
        "name": "transferOwnership",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "to_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "transferPauser",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "to_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "transferTreasury",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "to_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "treasury",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "treasuryRewardPercentage",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "validatorCanVote",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "addr_"
            },
            {
                "type": "bytes32",
                "name": "taskid_"
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "validatorDeposit",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "validator_"
            },
            {
                "type": "uint256",
                "name": "amount_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "validatorMinimumPercentage",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "validatorWithdraw",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "count_"
            },
            {
                "type": "address",
                "name": "to_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "validatorWithdrawPendingAmount",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "validators",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": "staked"
            },
            {
                "type": "uint256",
                "name": "since"
            },
            {
                "type": "address",
                "name": "addr"
            }
        ]
    },
    {
        "type": "function",
        "name": "version",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "voteOnContestation",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "bytes32",
                "name": "taskid_"
            },
            {
                "type": "bool",
                "name": "yea_"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "withdrawAccruedFees",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": []
    }
]
