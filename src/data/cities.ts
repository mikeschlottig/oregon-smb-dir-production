import type { ImageMetadata } from "astro";
import albany from "@/images/cities/albany.jpg";
import ashland from "@/images/cities/ashland.jpg";
import bend from "@/images/cities/bend_oregon_website_image.png";
import corvallis from "@/images/cities/corvallis_website_image.png";
import eugene from "@/images/cities/eugene.jpg";
import grantsPass from "@/images/cities/grants-pass.jpg";
import klamathFalls from "@/images/cities/klamath_falls_oregon.png";
import medford from "@/images/cities/medford.jpg";
import portland from "@/images/cities/portland-metro.jpg";
import roseburg from "@/images/cities/roseburg.jpg";
import salem from "@/images/cities/salem.jpg";
import springfield from "@/images/cities/springfield.jpg";

export type City = {
  name: string;
  slug: string;
  population: string;
  tagline: string;
  description: string;
  image: ImageMetadata;
  region: string;
};

export const cities: City[] = [
  { name: "Albany", slug: "albany", population: "57,000+", tagline: "Historic Downtown Oregon", description: "Victorian architecture and rare metals manufacturing heritage in the heart of the Willamette Valley.", image: albany, region: "Oregon I-5 Corridor" },
  { name: "Ashland", slug: "ashland", population: "21,000+", tagline: "Culture & Mountain Charm", description: "Oregon Shakespeare Festival city nestled in the Siskiyou Mountains.", image: ashland, region: "Oregon I-5 Corridor" },
  { name: "Bend", slug: "bend", population: "100,000+", tagline: "High Desert Adventure Capital", description: "Outdoor recreation, craft breweries, and stunning Cascade Mountain views in Central Oregon.", image: bend, region: "Central Oregon" },
  { name: "Corvallis", slug: "corvallis", population: "59,000+", tagline: "Heart of the Valley", description: "Home to Oregon State University and a thriving tech and agriculture innovation corridor.", image: corvallis, region: "Willamette Valley" },
  { name: "Eugene", slug: "eugene", population: "175,000+", tagline: "Emerald City of Oregon", description: "University town, Track Town USA, and Pacific Northwest culture capital.", image: eugene, region: "Oregon I-5 Corridor" },
  { name: "Grants Pass", slug: "grants-pass", population: "38,000+", tagline: "It's the Climate!", description: "White-water rafting and outdoor recreation on the Rogue River.", image: grantsPass, region: "Oregon I-5 Corridor" },
  { name: "Klamath Falls", slug: "klamath-falls", population: "22,000+", tagline: "Oregon's City of Sunshine", description: "Gateway to Crater Lake and a hub for outdoor adventure in Southern Oregon's high desert.", image: klamathFalls, region: "Klamath Basin · Southern Oregon" },
  { name: "Medford", slug: "medford", population: "85,000+", tagline: "Rogue Valley Hub", description: "Southern Oregon's largest city and gateway to the Rogue Valley.", image: medford, region: "Oregon I-5 Corridor" },
  { name: "Portland", slug: "portland", population: "650,000+", tagline: "Rose City", description: "Oregon's vibrant cultural and economic metropolis on the banks of the Willamette River.", image: portland, region: "Oregon I-5 Corridor" },
  { name: "Roseburg", slug: "roseburg", population: "23,000+", tagline: "Douglas County Gem", description: "Surrounded by lush forests and award-winning wineries in the Umpqua Valley.", image: roseburg, region: "Oregon I-5 Corridor" },
  { name: "Salem", slug: "salem", population: "175,000+", tagline: "Oregon's Capital City", description: "Seat of Oregon government, surrounded by the fertile Willamette Valley.", image: salem, region: "Oregon I-5 Corridor" },
  { name: "Springfield", slug: "springfield", population: "62,000+", tagline: "Gateway to Adventure", description: "Vibrant community neighboring Eugene along the Willamette River.", image: springfield, region: "Oregon I-5 Corridor" },
];

export const getCityBySlug = (slug: string) => cities.find((c) => c.slug === slug);
