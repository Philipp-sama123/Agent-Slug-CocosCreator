import { Component, Button, _decorator, Node } from "cc";
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

  @property({ type: Button })
  pauseButton: Button;

  @property({ type: Node })
  public pauseUI: Node;

  @property({ type: PlayerController })
  player: PlayerController;

  private _isPaused: boolean = false;

  protected onLoad(): void {
    // Jump, slide, shoot actions
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

    // Movement left
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

    // Movement right
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

    // Sprint actions should be tied to the sprintButton directly
    this.sprintButton.node.on(
      Node.EventType.TOUCH_START,
      this.sprintButtonPressed,
      this
    );
    this.sprintButton.node.on(
      Node.EventType.TOUCH_END,
      this.sprintButtonReleased,
      this
    );
    this.sprintButton.node.on(
      Node.EventType.TOUCH_CANCEL,
      this.sprintButtonReleased,
      this
    );

    // Pause toggle
    this.pauseButton.node.on(
      Node.EventType.TOUCH_START,
      this.togglePaused,
      this
    );
  }

  sprintButtonPressed(event: Event): void {
    this.player.setIsRunning(true);
  }

  sprintButtonReleased(event: Event): void {
    this.player.setIsRunning(false);
  }

  onMoveButtonTouchEnd(event: Event): void {
    this.player.move(0);
  }

  onMoveLeftButtonPressed(event: Event): void {
    this.player.move(-0.5);
  }

  onMoveRightButtonPressed(event: Event): void {
    this.player.move(0.5);
  }

  onShootButtonPressed(event: Event): void {
    this.player.shoot();
  }

  onSlideButtonPressed(event: Event): void {
    this.player.dodge();
  }

  onJumpButtonPressed(event: Event): void {
    this.player.jump();
  }

  togglePaused(event: Event): void {
    this.pauseUI.active = !this._isPaused;
    this._isPaused = !this._isPaused;
  }

  protected update(dt: number): void {
    if (this.joystick) {
      this.player.setHorizontalInput(this.joystick.input.x);
    }
  }
}
