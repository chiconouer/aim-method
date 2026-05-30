export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ModuleQuiz {
  moduleId: number;
  questions: QuizQuestion[];
}

export const QUIZZES: ModuleQuiz[] = [
  {
    moduleId: 1,
    questions: [
      {
        id: 1,
        question: "What is the role of each platform in the business model?",
        options: [
          "Both Instagram and Fanvue are for making money",
          "Instagram brings attention, Fanvue makes the money",
          "Fanvue brings attention, Instagram makes the money",
          "Both are just for posting free content",
        ],
        correctIndex: 1,
      },
      {
        id: 2,
        question:
          "Why should you never post explicit content for free on your Fanvue wall?",
        options: [
          "Because Fanvue bans that type of content",
          "Because Instagram can ban your account",
          "Because no one will pay for PPVs or DMs if they already see everything for free",
          "Because free content has lower quality",
        ],
        correctIndex: 2,
      },
      {
        id: 3,
        question: "What should your Instagram look like?",
        options: [
          "Like an adult content page",
          "Like a normal influencer page — aesthetic, lifestyle, fashion",
          "Like a product catalog",
          "The look doesn't matter, only the number of posts",
        ],
        correctIndex: 1,
      },
      {
        id: 4,
        question:
          "What are the 5 elements every high-performing piece of content gets right?",
        options: [
          "Caption, hashtags, timing, filter, and location",
          "Aesthetic/color scheme, outfits, backgrounds, poses, and facial expressions",
          "Number of posts, followers, likes, comments, and shares",
          "Price, platform, niche, age, and country",
        ],
        correctIndex: 1,
      },
      {
        id: 5,
        question: "What is the main filter when choosing your niche?",
        options: [
          "Which niche guarantees the most profit",
          "Which niche is easiest to create",
          "Whether the model makes someone stop scrolling instantly (grabs attention in under 2 seconds)",
          "Which niche has the least competition",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    moduleId: 2,
    questions: [
      {
        id: 1,
        question:
          "Which of the three tools is the only paid one, and what is it used for?",
        options: [
          "SnapInsta — used to create your model and content",
          "Higgsfield — used to create your model, images, and videos",
          "Gemini AI — used to download Instagram content",
          "Pinterest — used to write prompts",
        ],
        correctIndex: 1,
      },
      {
        id: 2,
        question: "What is Gemini AI used for in this course?",
        options: [
          "To generate the final images",
          "To download high-quality Instagram videos",
          "To write the prompts you paste into Higgsfield",
          "To edit your videos",
        ],
        correctIndex: 2,
      },
      {
        id: 3,
        question:
          "Why is the reference image so important after you create your model?",
        options: [
          "Because you can only use it once",
          "Because you use it as the base for every new photo and video, keeping her looking consistent",
          "Because Higgsfield deletes it automatically",
          "Because it's only needed for videos",
        ],
        correctIndex: 1,
      },
      {
        id: 4,
        question:
          "When you paste the Gemini prompt into Nanobanana Pro, what part must you delete?",
        options: [
          "The background and lighting description",
          "The outfit and setting description",
          "The description of the girl (face, hair, body) — so you can use your own model instead",
          "Nothing, you paste it exactly as is",
        ],
        correctIndex: 2,
      },
      {
        id: 5,
        question:
          "What is the key step that turns a still image into a video of your model?",
        options: [
          "Uploading the video directly to Instagram",
          "Taking a screenshot of the last frame",
          "Using Motion Control in Higgsfield with your reference image + the matching pose image",
          "Recording your screen while the image loads",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    moduleId: 3,
    questions: [
      {
        id: 1,
        question:
          "On Day 1 of warming up your account, what should you do?",
        options: [
          "Post your first image and add your bio link",
          "Buy followers and start following people",
          "Only set up your bio and do 15-20 min of light engagement (no links, no following)",
          "Post a reel right away to test the algorithm",
        ],
        correctIndex: 2,
      },
      {
        id: 2,
        question:
          "When are you allowed to add your encrypted Fanvue link to your bio?",
        options: [
          "On Day 1, right after creating the account",
          "On Day 4, after your first post",
          "On Day 21 at the earliest (later is even safer)",
          "Never — links aren't allowed on Instagram",
        ],
        correctIndex: 2,
      },
      {
        id: 3,
        question:
          "What is the rule for posting CTA stories (with your link) once you start?",
        options: [
          "Post one every single day",
          "Post one, then wait 3 days before the next one",
          "Post as many as you want, anytime",
          "Only post them on weekends",
        ],
        correctIndex: 1,
      },
      {
        id: 4,
        question:
          "How does Instagram decide who to show your content to?",
        options: [
          "Based only on how many followers you have",
          "Based on the location and type of content of the accounts you interact with",
          "Randomly, with no pattern",
          "Based on how much you pay for ads",
        ],
        correctIndex: 1,
      },
      {
        id: 5,
        question:
          "Which of these is NON-NEGOTIABLE to keep your account safe?",
        options: [
          "Posting at least 5 reels per day",
          "Sending your Fanvue link in the DMs",
          "Disclosing that your model is AI (in bio or using Instagram's AI label)",
          "Following 100 accounts per day",
        ],
        correctIndex: 2,
      },
      {
        id: 6,
        question: "How does the \"bubble\" system work when you post?",
        options: [
          "Instagram shows your post to everyone at once",
          "Instagram tests your post on a small audience first; if it performs, it pushes it to bigger and bigger bubbles",
          "Your post only reaches your existing followers",
          "Bubbles only apply to paid ads",
        ],
        correctIndex: 1,
      },
      {
        id: 7,
        question:
          "Why should you buy an aged email instead of creating a brand new one?",
        options: [
          "Aged emails are cheaper",
          "Instagram trusts older emails more — it sees them as established and trustworthy",
          "New emails can't be used on Instagram",
          "Aged emails come with free followers",
        ],
        correctIndex: 1,
      },
      {
        id: 8,
        question:
          "What is the rule for how often you do interactions in the Followers Farm?",
        options: [
          "As many as possible, all day long",
          "3 interactions every 30 minutes, max 5 rounds per day",
          "100 interactions in one sitting, once a day",
          "Only 1 interaction per day",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    moduleId: 4,
    questions: [
      {
        id: 1,
        question: "Why should you post carousels instead of single images?",
        options: [
          "They're cheaper to create",
          "The algorithm pushes them more, and multiple poses make the model feel real and authentic",
          "Single images are banned on Instagram",
          "Carousels don't need to match your niche",
        ],
        correctIndex: 1,
      },
      {
        id: 2,
        question: "What's the right mindset for your feed content?",
        options: [
          "Every post must have the identical background for a perfect grid",
          "Volume beats perfection — stay consistent and authentic, don't obsess over a perfectly uniform feed",
          "Only post once a week with a perfect image",
          "Make every image as explicit as possible",
        ],
        correctIndex: 1,
      },
      {
        id: 3,
        question:
          "How do you create multiple carousel images of the same scene in Nanobanana Pro?",
        options: [
          "Take real photos with a camera",
          "Upload your existing image and prompt it to keep the same background/outfit but change the pose",
          "Download them from Pinterest",
          "Screenshot the same image multiple times",
        ],
        correctIndex: 1,
      },
      {
        id: 4,
        question:
          "What's the only real technical difference when creating story images?",
        options: [
          "You must use a different AI tool",
          "Set the image output to 9:16 vertical format",
          "Stories must be black and white",
          "Stories can't include your model",
        ],
        correctIndex: 1,
      },
      {
        id: 5,
        question: "Why are highlights important on your profile?",
        options: [
          "They replace the need for a bio",
          "New visitors see them instantly — organized highlights build connection and keep them on your profile longer",
          "They let you post your link every day",
          "They're only for paid subscribers",
        ],
        correctIndex: 1,
      },
      {
        id: 6,
        question: "What must every reel do in the first two seconds?",
        options: [
          "Show your Fanvue link",
          "Grab attention — if they don't stop scrolling immediately, the video is done",
          "Play a trending song fully",
          "Ask people to subscribe",
        ],
        correctIndex: 1,
      },
      {
        id: 7,
        question:
          "Which tool and setting do you use for premium Fanvue content, and what line must every prompt start with?",
        options: [
          "Nanobanana Pro in HD, no special line needed",
          "Seedream 4.5 in 4K mode, starting every prompt with the line that locks your model's exact face and body features",
          "Gemini AI, starting with your model's name",
          "SnapInsta, with no prompt required",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    moduleId: 5,
    questions: [
      {
        id: 1,
        question: "What's the recommended subscription pricing strategy?",
        options: [
          "Set it high at $50 with no discount",
          "Set base price at $13.50, then add a 70% first-month discount (unlimited) to display $4.05",
          "Make it completely free forever",
          "Charge $100 for the first month only",
        ],
        correctIndex: 1,
      },
      {
        id: 2,
        question: "Where does about 90% of your revenue actually come from?",
        options: [
          "The subscription fee",
          "Instagram ads",
          "Pay-per-view content and DMs",
          "Selling the AI model itself",
        ],
        correctIndex: 2,
      },
      {
        id: 3,
        question:
          "Which setting should you turn ON when setting up your account?",
        options: [
          "Follow for Free (always on)",
          "Allow Followers Messaging",
          "Blur Preview Images (so no one sees content without subscribing)",
          "None of the settings matter",
        ],
        correctIndex: 2,
      },
      {
        id: 4,
        question:
          "Why can't you put your Fanvue link directly in your Instagram bio?",
        options: [
          "Fanvue charges a fee for it",
          "Instagram detects direct adult-platform links and can flag or ban your account",
          "The link is too long",
          "You actually can, with no problem",
        ],
        correctIndex: 1,
      },
      {
        id: 5,
        question:
          "What tool do you use to create the safe \"encrypted\" bio link?",
        options: [
          "Higgsfield",
          "SnapInsta",
          "GetAllMyLinks (or a similar link-in-bio tool)",
          "Gemini AI",
        ],
        correctIndex: 2,
      },
      {
        id: 6,
        question:
          "What's the rule for posting a story with your encrypted link attached?",
        options: [
          "Post one every day",
          "Post one, then wait 3 full days before the next",
          "Post as many as you want",
          "Never use story links",
        ],
        correctIndex: 1,
      },
      {
        id: 7,
        question:
          "How should you price content in DMs (your biggest earner)?",
        options: [
          "Always free to keep subscribers happy",
          "Between $15 and $50, depending on what it is",
          "Exactly the same as the subscription",
          "Over $500 per message",
        ],
        correctIndex: 1,
      },
      {
        id: 8,
        question: "What's the strategy to truly scale your income?",
        options: [
          "Lower your prices to zero",
          "Delete your first model and start over",
          "Launch additional AI models — repeat the proven blueprint for a 2nd, 3rd, 4th",
          "Stop posting once you have subscribers",
        ],
        correctIndex: 2,
      },
    ],
  },
];
