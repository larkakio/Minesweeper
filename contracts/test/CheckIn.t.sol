// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DailyCheckIn} from "../src/CheckIn.sol";

contract CheckInTest is Test {
    DailyCheckIn public c;

    address alice = address(0xA11CE);

    function setUp() public {
        c = new DailyCheckIn();
    }

    function test_checkIn_first_time() public {
        vm.prank(alice);
        uint256 day = block.timestamp / 1 days;
        vm.expectEmit(true, false, false, true);
        emit DailyCheckIn.CheckedIn(alice, day, 1);
        c.checkIn();
        assertEq(c.streak(alice), 1);
        assertEq(c.lastCheckInDay(alice), day + 1);
    }

    function test_revert_second_same_day() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.expectRevert(DailyCheckIn.AlreadyCheckedIn.selector);
        c.checkIn();
        vm.stopPrank();
    }

    function test_revert_value_sent() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(DailyCheckIn.NoTips.selector);
        c.checkIn{value: 1 wei}();
    }

    function test_streak_consecutive_days() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(block.timestamp + 1 days);
        c.checkIn();
        assertEq(c.streak(alice), 2);
        vm.warp(block.timestamp + 1 days);
        c.checkIn();
        assertEq(c.streak(alice), 3);
        vm.stopPrank();
    }

    function test_streak_resets_after_gap() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(block.timestamp + 1 days);
        c.checkIn();
        assertEq(c.streak(alice), 2);
        vm.warp(block.timestamp + 3 days);
        c.checkIn();
        assertEq(c.streak(alice), 1);
        vm.stopPrank();
    }
}
