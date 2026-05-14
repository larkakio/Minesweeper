// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice One L2 check-in per UTC calendar day. No ETH accepted (gas only).
/// @dev `lastCheckInDay` stores (calendarDay + 1); 0 means never checked in.
contract DailyCheckIn {
    mapping(address => uint256) public lastCheckInDay;
    mapping(address => uint256) public streak;

    event CheckedIn(address indexed user, uint256 dayIndex, uint256 streak);

    error NoTips();
    error AlreadyCheckedIn();

    function checkIn() external payable {
        if (msg.value != 0) revert NoTips();

        uint256 day = block.timestamp / 1 days;
        uint256 stored = lastCheckInDay[msg.sender];
        uint256 lastDay = stored == 0 ? type(uint256).max : stored - 1;

        if (lastDay == day) revert AlreadyCheckedIn();

        uint256 newStreak;
        if (lastDay != type(uint256).max && lastDay == day - 1) {
            newStreak = streak[msg.sender] + 1;
        } else {
            newStreak = 1;
        }

        lastCheckInDay[msg.sender] = day + 1;
        streak[msg.sender] = newStreak;

        emit CheckedIn(msg.sender, day, newStreak);
    }
}
