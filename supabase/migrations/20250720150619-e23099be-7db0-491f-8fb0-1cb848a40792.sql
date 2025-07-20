-- Create the main tables for the stock prediction app

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stocks table
CREATE TABLE public.stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  current_price DECIMAL(10,2),
  change_24h DECIMAL(5,2),
  market_cap BIGINT,
  volume_24h BIGINT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contest_periods table
CREATE TABLE public.contest_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  prediction_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  total_participants INTEGER DEFAULT 0,
  prize_pool DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create predictions table
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stock_id UUID NOT NULL REFERENCES public.stocks(id),
  contest_id UUID NOT NULL REFERENCES public.contest_periods(id),
  predicted_direction TEXT NOT NULL CHECK (predicted_direction IN ('up', 'down')),
  predicted_price DECIMAL(10,2),
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 100),
  reasoning TEXT,
  actual_result TEXT CHECK (actual_result IN ('correct', 'incorrect', 'pending')),
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, stock_id, contest_id)
);

-- Create leaderboard table
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contest_id UUID NOT NULL REFERENCES public.contest_periods(id),
  total_points INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contest_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for stocks (public read access)
CREATE POLICY "Stocks are viewable by everyone" 
ON public.stocks FOR SELECT USING (true);

-- Create RLS policies for contest_periods (public read access)
CREATE POLICY "Contest periods are viewable by everyone" 
ON public.contest_periods FOR SELECT USING (true);

-- Create RLS policies for predictions
CREATE POLICY "Users can view their own predictions" 
ON public.predictions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own predictions" 
ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" 
ON public.predictions FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for leaderboard (public read access)
CREATE POLICY "Leaderboard is viewable by everyone" 
ON public.leaderboard FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at
  BEFORE UPDATE ON public.stocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contest_periods_updated_at
  BEFORE UPDATE ON public.contest_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.stocks (symbol, name, current_price, change_24h, market_cap, volume_24h, is_featured) VALUES
('AAPL', 'Apple Inc.', 150.00, 2.5, 2400000000000, 50000000, true),
('GOOGL', 'Alphabet Inc.', 2800.00, -1.2, 1800000000000, 30000000, true),
('MSFT', 'Microsoft Corporation', 420.00, 1.8, 3100000000000, 40000000, true),
('TSLA', 'Tesla Inc.', 180.00, -3.5, 570000000000, 80000000, true),
('AMZN', 'Amazon.com Inc.', 3200.00, 0.8, 1600000000000, 25000000, true);

INSERT INTO public.contest_periods (name, start_date, end_date, prediction_deadline, is_active, total_participants, prize_pool) VALUES
('Weekly Stock Challenge - Week 1', 
 '2025-07-20 00:00:00+00', 
 '2025-07-27 23:59:59+00', 
 '2025-07-22 23:59:59+00', 
 true, 
 156, 
 1000.00);