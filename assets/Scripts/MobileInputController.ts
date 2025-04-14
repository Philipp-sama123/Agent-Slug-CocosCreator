import { _decorator, Button, Component, Node, NodeEventType } from "cc";
import { Joystick } from "./Joystick";
import { PlayerController } from "./PlayerController";
const { ccclass, property } = _decorator;

@ccclass("MobileInputController")
export class MobileInputController extends Component {
  @property({ type: Joystick })
  joystick: Joystick;
  @property({ type: Button })
  jumpButton: Button;
  @property({ type: Button })
  shootButton: Button;
  @property({ type: Button })
  slideButton: Button;
  @property({ type: Button })
  moveLeftButton: Button;
  @property({ type: Button })
  moveRightButton: Button;
  @property({ type: Button })
  sprintButton: Button;
  @property({ type: PlayerController })
  player: PlayerController;

  protected onLoad(): void {
    this.jumpButton.node.on(
      Node.EventType.TOUCH_START,
      this.onJumpButtonPressed,
      this
    );
    this.slideButton.node.on(
      Node.EventType.TOUCH_START,
      this.onSlideButtonPressed,
      this
    );
    this.shootButton.node.on(
      Node.EventType.TOUCH_START,
      this.onShootButtonPressed,
      this
    );
    /**Movement */
    this.moveLeftButton.node.on(
      Node.EventType.TOUCH_START,
      this.onMoveLeftButtonPressed,
      this
    );
    this.moveLeftButton.node.on(
      Node.EventType.TOUCH_END,
      this.onMoveButtonTouchEnd,
      this
    );
    this.moveLeftButton.node.on(
      Node.EventType.TOUCH_CANCEL,
      this.onMoveButtonTouchEnd,
      this
    );
    this.moveRightButton.node.on(
      Node.EventType.TOUCH_START,
      this.onMoveRightButtonPressed,
      this
    );
    this.moveRightButton.node.on(
      Node.EventType.TOUCH_END,
      this.onMoveButtonTouchEnd,
      this
    );
    this.moveRightButton.node.on(
      Node.EventType.TOUCH_CANCEL,
      this.onMoveButtonTouchEnd,
      this
    );
    this.sprintButton.node.on(
      Node.EventType.TOUCH_START,
      this.sprintButtonPressed,
      this
    );
    this.moveRightButton.node.on(
      Node.EventType.TOUCH_END,
      this.sprintButtonReleased,
      this
    );
    this.moveRightButton.node.on(
      Node.EventType.TOUCH_CANCEL,
      this.sprintButtonReleased,
      this
    );
  }

  sprintButtonReleased(
    TOUCH_END: NodeEventType,
    sprintButtonReleased: any,
    arg2: this
  ) {
    this.player.setIsRunning(false);
  }
  sprintButtonPressed(
    TOUCH_START: NodeEventType,
    sprintButtonPressed: any,
    arg2: this
  ) {
    this.player.setIsRunning(true);
  }
  onMoveButtonTouchEnd(
    TOUCH_START: NodeEventType,
    onRunLeftButtonPressed: any,
    arg2: this
  ) {
    this.player.move(0);
  }
  onMoveLeftButtonPressed(
    TOUCH_START: NodeEventType,
    onMoveLeftButtonPressed: any,
    arg2: this
  ) {
    this.player.move(-0.5);
  }
  onMoveRightButtonPressed(
    TOUCH_START: NodeEventType,
    onMoveRightButtonPressed: any,
    arg2: this
  ) {
    this.player.move(0.5);
  }
  onShootButtonPressed(
    TOUCH_START: NodeEventType,
    onShootButtonPressed: any,
    arg2: this
  ) {
    this.player.shoot();
  }
  onSlideButtonPressed(
    TOUCH_START: NodeEventType,
    onSlideButtonPressed: any,
    arg2: this
  ) {
    this.player.dodge();
  }
  onJumpButtonPressed(
    TOUCH_START: NodeEventType,
    onJumpButtonPressed: any,
    arg2: this
  ) {
    this.player.jump();
  }
  protected update(dt: number): void {
    if (this.joystick) {
      this.player.setHorizontalInput(this.joystick.input.x);
    }
  }
}
