pragma solidity >=0.6.0 <0.7.0;
//SPDX-License-Identifier: MIT

//import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/math/SafeMath.sol";


contract YourChallenge is Ownable {

  // using SafeMath for uint256;

  struct _challengesSt {
    address payable add1;
    address payable add2;
    address winner;

    uint256 ath1;
    uint256 ath2;

    uint256 dist1;
    uint256 dist2;

    uint256 mins;
    uint256 deadline;

    uint256 balances;

    bool start;
    bool completed;
    bool end;

  }

  uint256 public _challengesCount;                             // generate challengeIds by counting
  mapping(uint256 => _challengesSt) public _challengesMap;      // challengeId => Challenge Struct
  // mapping(address => uint256[]) public _challengesUserMap;     // maps player => placed challengeIds 


  uint256 public threshold;

  mapping ( address => uint256 ) public balances;

  constructor() public {
    threshold = 1 ether;
  }

  // create challenge with two athletes
  event Challenge(address _add1,address _add2, uint256 _ath1, uint256 _ath2, uint _mins, uint256 _challengesCount);
  
  function challenge(address payable _add1, address payable _add2, uint256 _ath1, uint256 _ath2, uint _mins) public returns (uint256) {
    
    _challengesSt memory _c = _challengesSt({
      add1 : _add1,
      add2 : _add2,
      winner: address(0),
      ath1 : _ath1,
      ath2 : _ath2,
      dist1 : 0,
      dist2 : 0,
      mins : _mins * 1 minutes,
      deadline : 0,
      balances:0,
      start: false,
      completed:false,
      end:false
    });

    _challengesCount = _challengesCount+1; // id based on count
    _challengesMap[_challengesCount] = _c;
    // _challengesUserMap[_add1].push(_challengesCount);

    emit Challenge(_add1, _add2, _ath1, _ath2, _mins, _challengesCount);

    return _challengesCount;
  }

  // Collect funds in a payable `stake()` function and track individual `balances` with a mapping:
  //  ( make sure to add a `Stake(address,uint256)` event and emit it for the frontend <List/> display )
  event Stake(uint256 _challengesId, address _add, uint256 _amount);

  function stake(uint256 _challengesId) public payable validAddress(_challengesId) {
    require(msg.value == threshold, "enter min 1 ether");
    require(balances[msg.sender] != threshold, "already staked 1 ether");
    require(_challengesMap[_challengesId].end == false, "end false");
    
    balances[msg.sender] += msg.value;
    emit Stake(_challengesId, msg.sender, msg.value);

    _challengesSt storage _c = _challengesMap[_challengesId];
    _c.balances += msg.value;
  }

  function startRun (uint256 _challengesId) public validAddress(_challengesId) {
    require(_challengesMap[_challengesId].start == false, "start false");
    require(_challengesMap[_challengesId].balances == threshold*2, "staking not completed");
    
    _challengesSt storage _c = _challengesMap[_challengesId];

    _c.start = true;
    _c.deadline = now + _c.mins * 1 minutes;

  }

  function updateDistance(uint256 _challengesId, uint256 _distance) public validAddress(_challengesId) {
    require(_challengesMap[_challengesId].start == true, "start true");
    require(_challengesMap[_challengesId].completed == false, "completed false");

    // require(now<=_challengesMap[_challengesId].deadline, "time end");
    
    _challengesSt storage _c = _challengesMap[_challengesId];

    if(msg.sender == _c.add1 ){
      _c.dist1 = _distance;
    } else {
      _c.dist2 = _distance;
    }
  }

  function finishRun(uint256 _challengesId) public validAddress(_challengesId) {
    require(_challengesMap[_challengesId].start == true, "start true");
    require(_challengesMap[_challengesId].completed == false, "completed false");

    // require(now>=_challengesMap[_challengesId].deadline, "time on");

    _challengesSt storage _c = _challengesMap[_challengesId];
    _c.completed = true;
  }

  event WinnerRun(uint256 _challengesId,address _winner);

  function winnerRun(uint256 _challengesId) public payable validAddress(_challengesId) {
    require(_challengesMap[_challengesId].completed == true, "completed true");
    require(_challengesMap[_challengesId].end == false, "end false");
    
    _challengesSt storage _c = _challengesMap[_challengesId];

    if(_c.dist1 > _c.dist2){
      _c.winner = _c.add1;
      _c.add1.transfer(_c.balances);
    } else {
      _c.winner = _c.add2;
      _c.add2.transfer(_c.balances);
    }
    emit WinnerRun(_challengesId, _c.winner);

    balances[_c.add1] = 0;
    balances[_c.add2] = 0;

    _c.balances = 0;
    _c.end = true;
  }

  // if the `threshold` was not met, allow everyone to call a `withdraw()` function
  // function withdraw(address payable _add) public {
  //   // require(!completed, "challenge completed");
  //   // require(now>=deadline, "challenge is still on");
  //   // require(balances[_add]>0, "Cant withdraw this address didnt have stake");
    
  //   uint256 amount = balances[_add];
  //   balances[_add] = 0;
  //   _add.transfer(amount);
  // }


  // Add a `timeLeft()` view function that returns the time left before the deadline for the frontend
  function timeLeft(uint256 _challengesId) public view validAddress(_challengesId) returns (uint256)  {
    
    _challengesSt storage _c = _challengesMap[_challengesId];

    if(now>_c.deadline) return 0;
    return _c.deadline - now;
  }

  // Modifiers can take inputs. This modifier checks that the
  // address passed in is not the zero address.
  modifier validAddress(uint256 _challengesId) {
    _challengesSt memory _c = _challengesMap[_challengesId];
    
    require(msg.sender != _c.add1 || msg.sender != _c.add2, "invalid address");
    require(_c.add1 != address(0), "Not valid address");
    require(_c.add2 != address(0), "Not valid address");
      _;
  }

  // Modifiers can take inputs. This modifier checks that the
  // address passed in is not the zero address.
  // modifier validAddress(address _addr) {
  //     require(_addr != address(0), "Not valid address");
  //     _;
  // }

  // // Can you implement your own modifier that checks whether deadline was passed or not? 
  // // Where can you use it?
  // modifier timePassed() {
  //   require(now<=deadline, "deadline Passed");
  //    _;
  // }
  // modifier timeInProgress() {
  //   require(now>=deadline, "challenge is still on");
  //    _;
  // }

  // modifier notCompleted() {
  //   require(!completed, "challenge completed");
  //   _;
  // }
  // modifier notStart() {
  //   require(!start, "start completed");
  //   _;
  // }

  fallback() external payable {

  }

  receive() external payable  {

  }
   
}