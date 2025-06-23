const { device, element, by, waitFor } = require('detox');

describe('Video Interactions', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should load the home screen with videos', async () => {
    // Wait for the home screen to load
    await waitFor(element(by.id('videoFlatList')))
      .toBeVisible()
      .withTimeout(10000);

    // Check if at least one video is visible
    await expect(element(by.id('videoCard'))).toBeVisible();
  });

  it('should play a video when it becomes visible', async () => {
    // Wait for the video to load and start playing
    await waitFor(element(by.id('videoPlayer')))
      .toBeVisible()
      .withTimeout(10000);

    // Check if the video is playing (no loading indicator visible)
    await waitFor(element(by.id('loadingIndicator')))
      .not.toBeVisible()
      .withTimeout(15000);
  });

  it('should like a video when the like button is pressed', async () => {
    // Wait for the interaction bar to be visible
    await waitFor(element(by.id('interactionBar')))
      .toBeVisible()
      .withTimeout(5000);

    // Get the initial like count
    const initialLikeCount = await element(by.id('likeCount')).getAttributes();

    // Press the like button
    await element(by.id('likeButton')).tap();

    // Wait for the like animation to complete
    await waitFor(element(by.id('likeButton')))
      .toHaveLabel('heart')
      .withTimeout(2000);

    // Check if the like count has increased
    const updatedLikeCount = await element(by.id('likeCount')).getAttributes();
    expect(parseInt(updatedLikeCount.label)).toBeGreaterThan(parseInt(initialLikeCount.label));
  });

  it('should open the comment modal when the comment button is pressed', async () => {
    // Press the comment button
    await element(by.id('commentButton')).tap();

    // Wait for the comment modal to appear
    await waitFor(element(by.id('commentModal')))
      .toBeVisible()
      .withTimeout(2000);

    // Check if the comment input is visible
    await expect(element(by.id('commentInput'))).toBeVisible();
  });

  it('should add a comment when the send button is pressed', async () => {
    // Make sure the comment modal is open
    if (!(await element(by.id('commentModal')).isVisible())) {
      await element(by.id('commentButton')).tap();
      await waitFor(element(by.id('commentModal')))
        .toBeVisible()
        .withTimeout(2000);
    }

    // Type a comment
    await element(by.id('commentInput')).typeText('This is a test comment');

    // Press the send button
    await element(by.id('sendButton')).tap();

    // Wait for the comment to be added
    await waitFor(element(by.text('This is a test comment')))
      .toBeVisible()
      .withTimeout(5000);

    // Close the comment modal
    await element(by.id('closeButton')).tap();

    // Wait for the modal to close
    await waitFor(element(by.id('commentModal')))
      .not.toBeVisible()
      .withTimeout(2000);
  });

  it('should share a video when the share button is pressed', async () => {
    // Press the share button
    await element(by.id('shareButton')).tap();

    // Wait for the share confirmation to appear
    await waitFor(element(by.text('Link Copied')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should scroll to the next video', async () => {
    // Get the ID of the current video
    const currentVideoId = await element(by.id('videoCard')).getAttributes().then(attrs => attrs.label);

    // Scroll down to the next video
    await element(by.id('videoFlatList')).scroll(500, 'down');

    // Wait for the next video to load
    await waitFor(element(by.id('videoPlayer')))
      .toBeVisible()
      .withTimeout(5000);

    // Get the ID of the new video
    const newVideoId = await element(by.id('videoCard')).getAttributes().then(attrs => attrs.label);

    // Check that we've scrolled to a different video
    expect(newVideoId).not.toEqual(currentVideoId);
  });
});
