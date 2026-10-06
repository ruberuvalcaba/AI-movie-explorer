export interface Movie {
	id: number;
	title: string;
	overview: string;
	poster_path: string | null;
	backdrop_path: string | null;
	release_date: string;
	vote_average: number;
	vote_count: number;
	popularity: number;
	// Movie details
	adult: boolean;
	belongs_to_collection?: MovieCollection | null;
	budget: number;
	genres: MovieGenre[];
	homepage: string | null;
	imdb_id: string | null;
	origin_country: string[];
	original_language: string;
	original_title: string;
	production_companies?: ProductionCompany[];
	production_countries?: ProductionCountry[];
	revenue: number;
	runtime: number | null;
	softcore: boolean;
	spoken_languages?: SpokenLanguage[];
	status: string;
	tagline: string | null;
	video: boolean;
}

export interface MiniMovie {
	id: number;
	title: string;
	poster_path: string | null;
	vote_average: number;
	release_date: string;
}

export interface MovieCollection {
	id: number;
	name: string;
	poster_path: string | null;
	backdrop_path: string | null;
}

export interface MovieGenre {
	id: number;
	name: string;
}

export interface ProductionCompany {
	id: number;
	logo_path: string | null;
	name: string;
	origin_country: string;
}

export interface ProductionCountry {
	iso_3166_1: string;
	name: string;
}

export interface SpokenLanguage {
	english_name: string;
	iso_639_1: string;
	name: string;
}
export interface MovieResponse {
	page: number;
	results: Movie[];
	total_pages: number;
	total_results: number;
}
export interface MovieCredits {
	id: number;
	cast: CastMember[];
	crew: CrewMember[];
}

export interface CastMember {
	id: number;
	name: string;
	character: string;
	profile_path: string | null;
	order: number;
}

export interface CrewMember {
	id: number;
	name: string;
	job: string;
	department: string;
}
