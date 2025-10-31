// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * SyntheticDataMarket
 *
 * A beginner-friendly decentralized data marketplace contract.
 * Buyers create data requests and deposit ETH into escrow.
 * Sellers submit metadata about generated datasets (NOT the dataset or download links).
 * The actual dataset remains off-chain and is delivered to the buyer outside the chain.
 * An off-chain quality verifier (set by the owner) uploads a QA report to IPFS and
 * submits the report CID and quality score to this contract. The contract stores
 * only the QA report CID, the score, status flags and escrow/payment state.
 *
 * Every variable, struct, enum and function is documented in plain English.
 */
contract SyntheticDataMarket {
	// -----------------------------
	// Basic administration
	// -----------------------------

	// Owner of the contract (deployer). Has admin rights like updating verifier.
	address public owner;

	// Address allowed to perform off-chain verifications and call the verify function.
	// This should point to an oracle or off-chain service account.
	address public qualityVerifier;

	// Toggle to require sellers to be whitelisted before submitting.
	bool public whitelistEnabled = false;

	// Mapping of addresses that are allowed to submit as sellers when whitelist is enabled.
	mapping(address => bool) public sellerWhitelist;

	// Optional registry of AI models (off-chain services) that may generate and verify data.
	// Owner can register models to give them explicit permission to self-verify uploads.
	mapping(address => bool) public modelRegistry;

	// Toggle to require models to be registered before they can self-verify.
	bool public modelRegistryEnabled = false;

	// Whether models are allowed to self-verify their own submissions.
	// Default: false to prevent models from approving their own work.
	bool public allowModelSelfVerify = false;

	// -----------------------------
	// Counters and balances
	// -----------------------------

	// Unique incremental ID for buyer requests.
	uint256 private requestCounter;

	// Unique incremental ID for seller submissions.
	uint256 private submissionCounter;

	// Total amount currently held in escrow for open requests.
	// Used to prevent accidental admin withdrawal of escrowed funds.
	uint256 public totalEscrowed;

	// Reentrancy simple guard
	uint256 private locked = 1;

	// -----------------------------
	// Data formats and statuses
	// -----------------------------

	// Supported data formats. Use enums to keep things readable.
	enum DataFormat { AUDIO, CSV, IMAGE, TEXT, VIDEO, MIXED }

	// Status of a request. OPEN: waiting for a submission; CLOSED: finalized (paid or refunded).
	enum RequestStatus { OPEN, CLOSED }

	// Status of a submission. PENDING: uploaded and waiting for quality check.
	// APPROVED/REJECTED: result of quality check. PAID/REFUNDED are terminal states.
	enum SubmissionStatus { PENDING, APPROVED, REJECTED, PAID, REFUNDED }

	// -----------------------------
	// Core data structures
	// -----------------------------

	// Struct that represents a buyer's request for synthetic data.
	// Plain English: a buyer asks for data, includes how much they pay and which formats are acceptable.
	struct Request {
		uint256 id;              // Unique request id
		address payable buyer;  // Buyer address who created the request
		uint256 budget;         // ETH amount deposited in escrow for this request (in wei)
		uint8 formatsMask;      // Bitmask representing accepted DataFormat values
		string description;     // Human readable description (optional)
		RequestStatus status;   // OPEN or CLOSED
		// When a submission is verified (approved or rejected), the QA report CID
		// and quality score are recorded here on the finalized request. This keeps
		// the chain storage focused on the QA report (IPFS PID) for the fulfilled request.
		uint8 qualityScore;      // Quality score recorded by verifier (0-100)
		string qualityReportCid; // IPFS CID of the QA report for the finalized request
		uint256 finalizedSubmissionId; // The submission id that finalized this request
		uint256 createdAt;      // Timestamp when request was created
	}

	// Struct that represents a seller submission for a specific request.
	// Plain English: seller uploaded a dataset with metadata; verifier will approve/reject it.
	struct Submission {
		uint256 id;                // Unique submission id
		uint256 requestId;         // The request this submission targets
		address payable seller;    // Seller address (account receiving payment)
		address model;             // Address of the model/service that generated/verified the data
		// NOTE: We store only lightweight metadata about the submission so frontends
		// can display it to buyers. We DO NOT store raw datasets or large files.
		// The actual dataset is delivered off-chain. The following metadata is optional
		// and helps buyers decide which submission to choose / view in the UI.
		DataFormat format;         // Data format (audio, image, csv, text, video, mixed)
		uint256 fileSize;          // Optional file size in bytes (0 if unknown)
		uint256 sampleCount;       // Optional sample count (0 if not applicable)
		string fileExtensions;     // Optional comma-separated extensions (e.g. "wav,mp3")
		string datasetReference;   // Optional reference to dataset (e.g., encrypted id or post-approval link). May be empty.
		SubmissionStatus status;   // PENDING, APPROVED, REJECTED, PAID, REFUNDED
		bool qualityChecked;       // Whether verifier has processed this submission
		uint256 createdAt;         // Timestamp of submission
	}

	// -----------------------------
	// Storage mappings for requests/submissions and tracking
	// -----------------------------

	// Request id => Request struct
	mapping(uint256 => Request) public requests;

	// Submission id => Submission struct
	mapping(uint256 => Submission) public submissions;

	// Buyer address => list of request ids they created
	mapping(address => uint256[]) public buyerRequests;

	// Seller address => list of submission ids they created
	mapping(address => uint256[]) public sellerSubmissions;

	// Verifier address => list of submission ids they processed (QA history per verifier)
	mapping(address => uint256[]) public verifierHistory;

	// Tracking if a given seller already submitted for a given request (prevent duplicate submissions)
	mapping(uint256 => mapping(address => bool)) public hasSubmittedForRequest;

	// -----------------------------
	// Events (front-end friendly)
	// -----------------------------

	// Emitted when a buyer creates a new request and deposits escrow.
	event RequestCreated(uint256 indexed requestId, address indexed buyer, uint256 budget, uint8 formatsMask, string description);

	// Emitted when a seller submits a dataset for a request.
	event SubmissionSubmitted(uint256 indexed submissionId, uint256 indexed requestId, address indexed seller, address model, DataFormat format, uint256 fileSize, uint256 sampleCount, string fileExtensions, string datasetReference);

	// Emitted when the verifier processes a submission.
	event SubmissionVerified(uint256 indexed submissionId, uint256 indexed requestId, bool approved, uint8 qualityScore, string qualityReportCid);

	// Emitted when payment is released to a seller.
	event PaymentReleased(uint256 indexed submissionId, address indexed seller, uint256 amount);

	// Emitted when a refund is issued to a buyer.
	event RefundIssued(uint256 indexed requestId, address indexed buyer, uint256 amount);

	// Emitted when the quality verifier address is updated.
	event QualityVerifierUpdated(address indexed previousVerifier, address indexed newVerifier);

	// Emitted when a seller is whitelisted or removed.
	event SellerWhitelistUpdated(address indexed seller, bool allowed);

	event ModelRegistryUpdated(address indexed model, bool allowed);

	// Emitted when owner performs an emergency withdrawal of non-escrowed funds.
	event EmergencyWithdrawal(address indexed to, uint256 amount);

	// -----------------------------
	// Modifiers
	// -----------------------------

	// Only owner may call
	modifier onlyOwner() {
		require(msg.sender == owner, "Only owner");
		_;
	}

	// Only quality verifier may call
	modifier onlyVerifier() {
		require(msg.sender == qualityVerifier, "Only quality verifier");
		_;
	}

	// Simple reentrancy guard
	modifier nonReentrant() {
		require(locked == 1, "Reentrant call");
		locked = 2;
		_;
		locked = 1;
	}

	// -----------------------------
	// Constructor
	// -----------------------------

	// Set the deployer as owner. Optionally set initial quality verifier (can be address(0)).
	constructor(address _initialVerifier) {
		owner = msg.sender;
		qualityVerifier = _initialVerifier;
		requestCounter = 0;
		submissionCounter = 0;
		locked = 1;
	}

	// -----------------------------
	// Helper functions
	// -----------------------------

	// Convert a DataFormat enum value to a bitmask bit.
	// Used so a request can accept multiple formats using a compact uint8 bitmask.
	function _formatBit(DataFormat f) internal pure returns (uint8) {
		return uint8(1) << uint8(f);
	}

	// Check whether a formatsMask (set by buyer) accepts a given DataFormat.
	function _acceptsFormat(uint8 formatsMask, DataFormat f) internal pure returns (bool) {
		return (formatsMask & _formatBit(f)) != 0;
	}

	// -----------------------------
	// Buyer functions
	// -----------------------------

	/**
	 * createRequest
	 * Buyer creates a data request and deposits ETH into escrow in the same call.
	 * - _formatsMask: a bitmask showing which DataFormat values are acceptable.
	 *   For example, to accept IMAGE and CSV: formatsMask = (1<<uint8(DataFormat.IMAGE)) | (1<<uint8(DataFormat.CSV))
	 * - msg.value is used as the budget and held in escrow until verification.
	 */
	function createRequest(uint8 _formatsMask, string calldata _description) external payable nonReentrant returns (uint256) {
		require(msg.value > 0, "Budget must be > 0");
		require(_formatsMask != 0, "Must accept at least one format");

		requestCounter++;
		uint256 rid = requestCounter;

		Request storage r = requests[rid];
		r.id = rid;
		r.buyer = payable(msg.sender);
		r.budget = msg.value;
		r.formatsMask = _formatsMask;
		r.description = _description;
		r.status = RequestStatus.OPEN;
		r.createdAt = block.timestamp;

		buyerRequests[msg.sender].push(rid);

		totalEscrowed += msg.value;

		emit RequestCreated(rid, msg.sender, msg.value, _formatsMask, _description);
		return rid;
	}

	/**
	 * cancelRequest
	 * Buyer can cancel an OPEN request and reclaim their escrow if no submissions were yet finalized.
	 * This is a convenience and safety function. Only the buyer can cancel their own request.
	 */
	function cancelRequest(uint256 _requestId) external nonReentrant {
		Request storage r = requests[_requestId];
		require(r.id != 0, "Request not found");
		require(r.buyer == msg.sender, "Only buyer");
		require(r.status == RequestStatus.OPEN, "Request not open");

		// Close request and refund buyer
		r.status = RequestStatus.CLOSED;

		uint256 amount = r.budget;
		r.budget = 0;
		totalEscrowed -= amount;

		(bool sent, ) = r.buyer.call{value: amount}('');
		require(sent, "Refund failed");

		emit RefundIssued(_requestId, r.buyer, amount);
	}

	// -----------------------------
	// Seller functions
	// -----------------------------

	/**
	 * submitDataset
	 * Sellers call this to register a submission for a buyer's request.
	 * IMPORTANT: The contract does NOT store datasets or download links. This call
	 * simply records that a seller (and an optional model) has produced data off-chain
	 * for the request. The QA report (uploaded by the verifier to IPFS) is the only
	 * artifact stored on-chain when verification happens.
	 */
	function submitDataset(
		uint256 _requestId,
		DataFormat _format,
		uint256 _fileSize,
		uint256 _sampleCount,
		string calldata _fileExtensions,
		string calldata _datasetReference,
		address _model
	) external nonReentrant returns (uint256) {
		Request storage r = requests[_requestId];
		require(r.id != 0, "Request not found");
		require(r.status == RequestStatus.OPEN, "Request not open");
		// We store lightweight metadata to help frontends and buyers. The actual
		// dataset remains off-chain and should be delivered/linked after approval.
		if (whitelistEnabled) {
			require(sellerWhitelist[msg.sender], "Seller not whitelisted");
		}
		require(!hasSubmittedForRequest[_requestId][msg.sender], "Already submitted for this request");

		submissionCounter++;
		uint256 sid = submissionCounter;

		Submission storage s = submissions[sid];
		s.id = sid;
		s.requestId = _requestId;
		s.seller = payable(msg.sender);
		// If caller provided a model address, record it; otherwise default to the caller.
		// This helps track which off-chain model created/verified the dataset.
		if (_model == address(0)) {
			s.model = msg.sender;
		} else {
			s.model = _model;
		}
	s.format = _format;
	s.fileSize = _fileSize;
	s.sampleCount = _sampleCount;
	s.fileExtensions = _fileExtensions;
	s.datasetReference = _datasetReference;
	s.status = SubmissionStatus.PENDING;
	s.qualityChecked = false;
	s.createdAt = block.timestamp;

		sellerSubmissions[msg.sender].push(sid);
		hasSubmittedForRequest[_requestId][msg.sender] = true;

		emit SubmissionSubmitted(sid, _requestId, msg.sender, s.model, s.format, s.fileSize, s.sampleCount, s.fileExtensions, s.datasetReference);
		return sid;
	}

	// -----------------------------
	// Verifier functions (off-chain service / oracle)
	// -----------------------------

	/**
	 * verifySubmission
	 * The quality verifier approves or rejects a submission. Only callable by the configured verifier.
	 * - If approved: pays seller from the request escrow and marks request CLOSED.
	 * - If rejected: refunds the buyer and marks request CLOSED.
	 * The verifier may optionally attach a quality score (0-100) and an IPFS CID pointing to a quality report.
	 */
	/**
	 * verifySubmission
	 * The quality verifier approves or rejects a submission. Only callable by the configured verifier
	 * OR by the model address that produced the dataset (self-verification), provided model registry
	 * rules (if enabled) are respected.
	 */
	function verifySubmission(uint256 _submissionId, bool _approved, uint8 _qualityScore, string calldata _qualityReportCid) external nonReentrant {
		Submission storage s = submissions[_submissionId];
		require(s.id != 0, "Submission not found");
		require(!s.qualityChecked, "Submission already verified");

		Request storage r = requests[s.requestId];
		require(r.id != 0, "Associated request not found");
		require(r.status == RequestStatus.OPEN, "Request already finalized");
		// Only allow verification by the configured quality verifier or (optionally)
		// by the model that created the submission. By default, models CANNOT self-verify
		// to prevent them from approving their own work.
		bool isVerifier = (msg.sender == qualityVerifier);
		bool isModel = (msg.sender == s.model);

		if (isModel) {
			// model is trying to verify: only allowed when admin explicitly enabled it
			require(allowModelSelfVerify, "Model self-verify disabled");
			// and the model must be registered if registry enforcement is on
			if (modelRegistryEnabled) {
				require(modelRegistry[msg.sender], "Model not registered");
			}
		}

		// final check: must be either the qualityVerifier or an allowed model
		require(isVerifier || isModel, "Only quality verifier or allowed model may verify");

	// Mark that verifier processed this submission.
	s.qualityChecked = true;

	// Record verifier history (who processed this QA)
	verifierHistory[msg.sender].push(_submissionId);

	// Store QA report CID and score on the finalized request so the contract
	// keeps only the QA report PID for the fulfilled request (not dataset data).
	r.qualityScore = _qualityScore;
	r.qualityReportCid = _qualityReportCid;
	r.finalizedSubmissionId = _submissionId;

		if (_approved) {
			// Pay the seller from escrow
			uint256 amount = r.budget;
			require(amount > 0, "No funds in escrow");

			// Update states before external interaction
			s.status = SubmissionStatus.APPROVED;
			r.status = RequestStatus.CLOSED;
			r.budget = 0;
			totalEscrowed -= amount;

			// Use low-level call to forward ETH and revert on failure
			(bool sent, ) = s.seller.call{value: amount}('');
			require(sent, "Payment to seller failed");

			s.status = SubmissionStatus.PAID;

			emit SubmissionVerified(_submissionId, s.requestId, true, _qualityScore, _qualityReportCid);
			emit PaymentReleased(_submissionId, s.seller, amount);
		} else {
			// Reject -> refund buyer
			uint256 amount = r.budget;
			require(amount > 0, "No funds in escrow");

			s.status = SubmissionStatus.REJECTED;
			r.status = RequestStatus.CLOSED;
			r.budget = 0;
			totalEscrowed -= amount;

			(bool sent, ) = r.buyer.call{value: amount}('');
			require(sent, "Refund to buyer failed");

			s.status = SubmissionStatus.REFUNDED;

			emit SubmissionVerified(_submissionId, s.requestId, false, _qualityScore, _qualityReportCid);
			emit RefundIssued(s.requestId, r.buyer, amount);
		}
	}

	// -----------------------------
	// Admin functions
	// -----------------------------

	/**
	 * setQualityVerifier
	 * Owner may update the address that is allowed to verify submissions.
	 */
	function setQualityVerifier(address _verifier) external onlyOwner {
		address previous = qualityVerifier;
		qualityVerifier = _verifier;
		emit QualityVerifierUpdated(previous, _verifier);
	}

	/**
	 * Model registry management
	 * Owner can enable/disable registry enforcement and add/remove models.
	 */
	function setModelRegistryEnabled(bool _enabled) external onlyOwner {
		modelRegistryEnabled = _enabled;
	}

	function updateModelRegistry(address _model, bool _allowed) external onlyOwner {
		modelRegistry[_model] = _allowed;
		emit ModelRegistryUpdated(_model, _allowed);
	}

	/**
	 * Control whether models may self-verify. Default is false (disabled).
	 * Owner should only enable this if there's an additional off-chain audit process.
	 */
	function setAllowModelSelfVerify(bool _allow) external onlyOwner {
		allowModelSelfVerify = _allow;
	}

	/**
	 * Get list of submission IDs processed by a verifier (QA history per verifier).
	 * This helps frontends and buyers see which reports/verifications a verifier performed.
	 */
	function getVerifierSubmissions(address _verifier) external view returns (uint256[] memory) {
		return verifierHistory[_verifier];
	}

	/**
	 * enableSellerWhitelist / disableSellerWhitelist
	 * Owner can require that only whitelisted sellers can submit.
	 */
	function setWhitelistEnabled(bool _enabled) external onlyOwner {
		whitelistEnabled = _enabled;
	}

	/**
	 * updateSellerWhitelist
	 * Add or remove a seller from the whitelist.
	 */
	function updateSellerWhitelist(address _seller, bool _allowed) external onlyOwner {
		sellerWhitelist[_seller] = _allowed;
		emit SellerWhitelistUpdated(_seller, _allowed);
	}

	/**
	 * emergencyWithdraw
	 * Allow owner to withdraw non-escrowed funds (contract balance minus totalEscrowed).
	 * This protects buyer escrow from being drained by the owner.
	 */
	function emergencyWithdraw(address payable _to, uint256 _amount) external onlyOwner nonReentrant {
		uint256 available = address(this).balance;
		require(available >= totalEscrowed, "Invariant: balance less than escrowed");
		uint256 freeBalance = available - totalEscrowed;
		require(_amount <= freeBalance, "Amount exceeds available non-escrow funds");

		(bool sent, ) = _to.call{value: _amount}('');
		require(sent, "Emergency withdraw failed");

		emit EmergencyWithdrawal(_to, _amount);
	}

	// -----------------------------
	// View helpers for front-ends
	// -----------------------------

	// Get list of request IDs for a buyer
	function getBuyerRequests(address _buyer) external view returns (uint256[] memory) {
		return buyerRequests[_buyer];
	}

	// Get list of submission IDs for a seller
	function getSellerSubmissions(address _seller) external view returns (uint256[] memory) {
		return sellerSubmissions[_seller];
	}

	// Decode whether a request accepts a particular format
	function requestAcceptsFormat(uint256 _requestId, DataFormat _format) external view returns (bool) {
		Request storage r = requests[_requestId];
		require(r.id != 0, "Request not found");
		return _acceptsFormat(r.formatsMask, _format);
	}

	// Fallback: accept ETH. Useful if someone sends ETH accidentally; keep it non-reverting.
	receive() external payable {}
	fallback() external payable {}

	// -----------------------------
	// Small utility: transfer ownership
	// -----------------------------

	// Change owner (only owner can call)
	function transferOwnership(address _newOwner) external onlyOwner {
		require(_newOwner != address(0), "Zero address");
		owner = _newOwner;
	}
}

